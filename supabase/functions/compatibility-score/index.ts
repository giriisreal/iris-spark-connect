import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userProfile, targetProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!userProfile || !targetProfile) {
      throw new Error('Both userProfile and targetProfile are required');
    }

    console.log('Computing compatibility between profiles...');

    const prompt = `You are a dating compatibility analyst. Analyze the compatibility between two people based on their profiles and return a compatibility score and insights.

User 1:
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

Analyze their compatibility and provide insights.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a dating compatibility expert. Be positive and encouraging.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'compatibility_result',
              description: 'Return the compatibility analysis result',
              parameters: {
                type: 'object',
                properties: {
                  score: { 
                    type: 'number', 
                    description: 'Compatibility score from 0 to 100' 
                  },
                  summary: { 
                    type: 'string', 
                    description: 'A short 1-2 sentence summary of compatibility' 
                  },
                  sharedInterests: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'List of shared interests' 
                  },
                  icebreaker: { 
                    type: 'string', 
                    description: 'A fun icebreaker message suggestion' 
                  },
                  compatibility_factors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key factors contributing to compatibility'
                  }
                },
                required: ['score', 'summary', 'icebreaker'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'compatibility_result' } }
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
    console.log('AI response:', JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({
      score: 75,
      summary: 'You two seem like a great match!',
      icebreaker: 'Ask about their interests!',
      sharedInterests: [],
      compatibility_factors: []
    }), {
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
