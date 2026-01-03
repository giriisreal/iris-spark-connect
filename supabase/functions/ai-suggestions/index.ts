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

    const { type, context, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "message_suggestions") {
      systemPrompt = `You are a friendly dating coach helping someone write messages. Generate 3 short, engaging message suggestions that are:
- Natural and conversational
- Flirty but respectful
- Between 5-20 words each
- Varied in style (one playful, one sincere, one question)

Return ONLY a JSON array of 3 strings, no other text.`;
      
      userPrompt = `Context about the match: ${context?.matchName || 'Unknown'}, interests: ${context?.interests?.join(', ') || 'not specified'}.
Recent conversation: ${messages?.slice(-3).map((m: any) => m.content).join(' | ') || 'No messages yet'}

Generate 3 message suggestions.`;
    } else if (type === "icebreaker") {
      systemPrompt = `You are a dating coach. Generate a clever, personalized icebreaker message based on shared interests. Keep it under 15 words, playful but not cheesy. Return ONLY the message, no quotes or extra text.`;
      
      userPrompt = `Their interests: ${context?.interests?.join(', ') || 'various hobbies'}. Their bio: ${context?.bio || 'Not provided'}`;
    } else if (type === "continue_conversation") {
      systemPrompt = `You are a dating coach. Based on the conversation, suggest a natural follow-up message. Keep it engaging and under 20 words. Return ONLY the message, no quotes.`;
      
      userPrompt = `Last few messages: ${messages?.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n') || 'No history'}`;
    }

    console.log(`AI Suggestions - Type: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    if (type === "message_suggestions") {
      try {
        // Try to parse as JSON array
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        result = { suggestions: JSON.parse(cleaned) };
      } catch {
        // Fallback: split by newlines
        result = { 
          suggestions: content.split('\n')
            .filter((s: string) => s.trim())
            .map((s: string) => s.replace(/^[\d\.\-\*]\s*/, '').replace(/^["']|["']$/g, ''))
            .slice(0, 3)
        };
      }
    } else {
      result = { suggestion: content.replace(/^["']|["']$/g, '').trim() };
    }

    console.log(`AI Suggestions result:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Suggestions error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
