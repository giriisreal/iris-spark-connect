import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Criteria = {
  gender: "male" | "female" | "non-binary" | "other" | null;
  maxAge: number | null;
  minAge: number | null;
  city: string | null;
  interests: string[] | null;
  keywords: string[];
  response: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth (verify inside the function; platform JWT verification is disabled)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Backend configuration missing");
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { message } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the user's profile (RLS-safe; profiles are readable)
    const { data: userProfile } = await authClient
      .from("profiles")
      .select("id, name, age, gender, bio, city, interests, looking_for")
      .eq("user_id", userId)
      .maybeSingle();

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: "User profile not found. Please complete onboarding first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Parse criteria (AI) ---
    // Keep this call small to conserve credits.
    let criteria: Criteria = {
      gender: null,
      maxAge: null,
      minAge: null,
      city: null,
      interests: null,
      keywords: ["match"],
      response: "Searching profiles...",
    };

    if (LOVABLE_API_KEY) {
      const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          max_tokens: 220,
          messages: [
            {
              role: "system",
              content:
                "You are IRIS AI. Output ONLY valid JSON. Schema: {gender:male|female|non-binary|other|null, maxAge:number|null, minAge:number|null, city:string|null, interests:string[]|null, keywords:string[], response:string}. Always include 3-8 keywords.",
            },
            {
              role: "user",
              content: `User request: ${message}\nUser's looking_for: ${(userProfile.looking_for || []).join(", ")}`,
            },
          ],
        }),
      });

      if (!parseResponse.ok) {
        if (parseResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (parseResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        const parseData = await parseResponse.json();
        const content = parseData.choices?.[0]?.message?.content || "";
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            criteria = {
              gender: parsed.gender ?? null,
              maxAge: typeof parsed.maxAge === "number" ? parsed.maxAge : null,
              minAge: typeof parsed.minAge === "number" ? parsed.minAge : null,
              city: parsed.city ?? null,
              interests: Array.isArray(parsed.interests) ? parsed.interests : null,
              keywords: Array.isArray(parsed.keywords) ? parsed.keywords : ["match"],
              response: typeof parsed.response === "string" ? parsed.response : "Searching profiles...",
            };
          }
        } catch {
          // leave default criteria
        }
      }
    }

    // --- Fetch candidate profiles ---
    let query = authClient
      .from("profiles")
      .select("id, name, age, bio, city, gender, interests, vibe_status, non_negotiables, pickup_lines, personal_notes")
      .neq("id", userProfile.id)
      .limit(30);

    if (criteria.gender) query = query.eq("gender", criteria.gender);
    if (criteria.maxAge) query = query.lte("age", criteria.maxAge);
    if (criteria.minAge) query = query.gte("age", criteria.minAge);
    if (criteria.city) query = query.ilike("city", `%${criteria.city}%`);

    const { data: profiles } = await query;

    // Photos
    const profileIds = (profiles || []).map((p) => p.id);
    const photosMap: Record<string, string> = {};

    if (profileIds.length > 0) {
      const { data: photos } = await authClient
        .from("profile_photos")
        .select("profile_id, photo_url, is_primary")
        .in("profile_id", profileIds);

      for (const photo of photos || []) {
        if (!photosMap[photo.profile_id] || photo.is_primary) {
          photosMap[photo.profile_id] = photo.photo_url;
        }
      }
    }

    // Score by keywords
    const kw = (criteria.keywords || []).map((k) => String(k).toLowerCase()).slice(0, 12);
    const scored = (profiles || [])
      .map((p) => {
        const bio = (p.bio || "").toLowerCase();
        const ints = (p.interests || []).map((i: string) => i.toLowerCase());
        let score = 0;
        for (const k of kw) {
          if (bio.includes(k)) score += 2;
          if (ints.some((i: string) => i.includes(k))) score += 3;
        }
        return { ...p, score, photoUrl: photosMap[p.id] || null };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        message: criteria.response,
        profiles: scored,
        criteria: {
          gender: criteria.gender,
          maxAge: criteria.maxAge,
          minAge: criteria.minAge,
          city: criteria.city,
          interests: criteria.interests,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("IRIS AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
