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
    console.log("Received message:", message, "userId:", userId);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase configuration missing");
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the user's profile to exclude from results
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, gender, looking_for")
      .eq("user_id", userId)
      .single();

    if (userError) {
      console.error("User profile error:", userError);
    }

    if (!userProfile) {
      console.log("User profile not found for userId:", userId);
      return new Response(
        JSON.stringify({ error: "User profile not found. Please complete your profile first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User profile found:", userProfile.id);

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

You MUST respond with ONLY a valid JSON object, no other text. The JSON should have these fields (use null for unspecified):
- gender: "male", "female", "non-binary", "other", or null
- maxAge: number or null
- minAge: number or null  
- city: string or null (normalize city names, e.g., "Bangalore" not "Bengaluru")
- interests: array of strings or null (e.g., ["finance", "tech", "music"])
- keywords: array of strings for bio/interest matching (always include at least one keyword based on the query)
- response: a friendly conversational message about what you're searching for

Example input: "Find me a finance nerd, woman under 25 in Bangalore"
Example response (ONLY JSON, nothing else):
{"gender":"female","maxAge":25,"minAge":null,"city":"Bangalore","interests":["finance"],"keywords":["finance","nerd","investment","stocks"],"response":"Looking for finance-savvy women under 25 in Bangalore! Let me find some great matches for you..."}

Example input: "Show me a tech nerd"
Example response:
{"gender":null,"maxAge":null,"minAge":null,"city":null,"interests":["tech","technology"],"keywords":["tech","nerd","programming","coding","software","developer"],"response":"Searching for tech enthusiasts! Let me find some great matches..."}`
          },
          { role: "user", content: message }
        ]
      }),
    });

    console.log("AI response status:", parseResponse.status);

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("AI parse error:", parseResponse.status, errorText);
      
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
      throw new Error("Failed to parse search criteria");
    }

    const parseData = await parseResponse.json();
    console.log("AI response data:", JSON.stringify(parseData));
    
    let criteria;
    
    try {
      const content = parseData.choices?.[0]?.message?.content || "";
      console.log("AI content:", content);
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        criteria = JSON.parse(jsonMatch[0]);
      } else {
        criteria = { 
          keywords: [message.toLowerCase()], 
          response: "Let me search for profiles matching your preferences..." 
        };
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      criteria = { 
        keywords: [message.toLowerCase()], 
        response: "I'll help you find matches! Let me search..." 
      };
    }

    console.log("Parsed criteria:", JSON.stringify(criteria));

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

    console.log("Found profiles:", profiles?.length || 0);

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

    console.log("Returning profiles:", scoredProfiles.length);

    return new Response(
      JSON.stringify({
        message: criteria.response || "Here are some matches for you!",
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