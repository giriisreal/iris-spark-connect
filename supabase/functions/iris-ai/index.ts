import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the user's profile to exclude from results
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, gender, looking_for")
      .eq("user_id", userId)
      .single();

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to parse the user's query and extract search criteria
    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are IRIS AI, a friendly matchmaking assistant. Parse the user's dating preference request and extract search criteria.
            
Return a JSON object with these fields (use null for unspecified):
- gender: "male", "female", "non-binary", "other", or null
- maxAge: number or null
- minAge: number or null  
- city: string or null (normalize city names, e.g., "Bangalore" not "Bengaluru")
- interests: array of strings or null (e.g., ["finance", "tech", "music"])
- keywords: array of strings for bio/interest matching

Also include a friendly "response" field with a conversational message about what you're looking for.

Example input: "Find me a finance nerd, woman under 25 in Bangalore"
Example output:
{
  "gender": "female",
  "maxAge": 25,
  "minAge": null,
  "city": "Bangalore",
  "interests": ["finance"],
  "keywords": ["finance", "nerd", "investment", "stocks"],
  "response": "Looking for finance-savvy women under 25 in Bangalore! Let me find some great matches for you..."
}`
          },
          { role: "user", content: message }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_search_criteria",
              description: "Parse dating search criteria from user message",
              parameters: {
                type: "object",
                properties: {
                  gender: { type: "string", enum: ["male", "female", "non-binary", "other"], nullable: true },
                  maxAge: { type: "number", nullable: true },
                  minAge: { type: "number", nullable: true },
                  city: { type: "string", nullable: true },
                  interests: { type: "array", items: { type: "string" }, nullable: true },
                  keywords: { type: "array", items: { type: "string" } },
                  response: { type: "string" }
                },
                required: ["keywords", "response"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_search_criteria" } }
      }),
    });

    if (!parseResponse.ok) {
      if (parseResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (parseResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await parseResponse.text();
      console.error("AI parse error:", parseResponse.status, errorText);
      throw new Error("Failed to parse search criteria");
    }

    const parseData = await parseResponse.json();
    let criteria;
    
    try {
      const toolCall = parseData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        criteria = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback to content parsing
        const content = parseData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        criteria = jsonMatch ? JSON.parse(jsonMatch[0]) : { keywords: [], response: "Let me search for profiles..." };
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      criteria = { keywords: [], response: "I'll help you find matches! Let me search..." };
    }

    console.log("Parsed criteria:", criteria);

    // Build the Supabase query
    let query = supabase
      .from("profiles")
      .select(`
        id, name, age, bio, city, gender, interests, vibe_status, 
        non_negotiables, pickup_lines, personal_notes
      `)
      .neq("id", userProfile.id)
      .limit(10);

    // Apply filters based on parsed criteria
    if (criteria.gender) {
      query = query.eq("gender", criteria.gender);
    }
    if (criteria.maxAge) {
      query = query.lte("age", criteria.maxAge);
    }
    if (criteria.minAge) {
      query = query.gte("age", criteria.minAge);
    }
    if (criteria.city) {
      query = query.ilike("city", `%${criteria.city}%`);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Profiles query error:", profilesError);
      throw new Error("Failed to fetch profiles");
    }

    // Fetch photos for the matched profiles
    const profileIds = profiles?.map(p => p.id) || [];
    let photosMap: Record<string, string> = {};
    
    if (profileIds.length > 0) {
      const { data: photos } = await supabase
        .from("profile_photos")
        .select("profile_id, photo_url, is_primary")
        .in("profile_id", profileIds);
      
      if (photos) {
        for (const photo of photos) {
          if (!photosMap[photo.profile_id] || photo.is_primary) {
            photosMap[photo.profile_id] = photo.photo_url;
          }
        }
      }
    }

    // Score and filter profiles based on keywords in bio/interests
    const scoredProfiles = (profiles || []).map(profile => {
      let score = 0;
      const bioLower = (profile.bio || "").toLowerCase();
      const interestsLower = (profile.interests || []).map((i: string) => i.toLowerCase());
      
      for (const keyword of criteria.keywords || []) {
        const kw = keyword.toLowerCase();
        if (bioLower.includes(kw)) score += 2;
        if (interestsLower.some((i: string) => i.includes(kw))) score += 3;
      }
      
      return { 
        ...profile, 
        score,
        photoUrl: photosMap[profile.id] || null
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    return new Response(
      JSON.stringify({
        message: criteria.response,
        profiles: scoredProfiles,
        criteria: {
          gender: criteria.gender,
          maxAge: criteria.maxAge,
          minAge: criteria.minAge,
          city: criteria.city,
          interests: criteria.interests
        }
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