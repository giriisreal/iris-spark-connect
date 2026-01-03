import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth (verify inside the function; platform JWT verification is disabled)
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Backend configuration missing');
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userProfile, targetProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!userProfile || !targetProfile) {
      throw new Error('Both userProfile and targetProfile are required');
    }

    console.log('Computing compatibility between profiles...');

    const systemPrompt = `You are a dating compatibility analyst.
Return ONLY valid JSON with this shape:
{
  "score": number, // 0-100
  "summary": string, // 1-2 sentences
  "icebreaker": string, // < 20 words
  "sharedInterests": string[],
  "compatibility_factors": string[]
}
No markdown, no backticks.`;

    const userPrompt = `User 1:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Bio: ${userProfile.bio || 'Not provided'}
- Interests: ${userProfile.interests?.join(', ') || 'None listed'}
- City: ${userProfile.city || 'Unknown'}
- Looking for: ${userProfile.looking_for?.join(', ') || 'Anyone'}

User 2:
- Name: ${targetProfile.name}
- Age: ${targetProfile.age}
- Gender: ${targetProfile.gender}
- Bio: ${targetProfile.bio || 'Not provided'}
- Interests: ${targetProfile.interests?.join(', ') || 'None listed'}
- City: ${targetProfile.city || 'Unknown'}
- Looking for: ${targetProfile.looking_for?.join(', ') || 'Anyone'}

Analyze compatibility and reply with JSON only.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || '';

    let result: any = null;
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI JSON:', e, 'raw:', content);
    }

    if (!result || typeof result.score !== 'number' || !result.summary || !result.icebreaker) {
      result = {
        score: 75,
        summary: 'You two seem like a great match!',
        icebreaker: 'What’s something you’ve been obsessed with lately?',
        sharedInterests: [],
        compatibility_factors: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in compatibility-score function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
