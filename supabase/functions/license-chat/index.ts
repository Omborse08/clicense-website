const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, licenseContext } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('License chat message:', message);

    const systemPrompt = `You are a helpful license expert assistant. You're helping a user understand a license for an AI model or open-source project.

License Context:
- License Name: ${licenseContext?.licenseName || 'Unknown'}
- License Type: ${licenseContext?.licenseType || 'Unknown'}
- Commercial Use: ${licenseContext?.commercialUse || 'Unknown'}
- Modification Allowed: ${licenseContext?.modificationAllowed ? 'Yes' : 'No'}
- Redistribution Allowed: ${licenseContext?.redistributionAllowed ? 'Yes' : 'No'}
- Verdict: ${licenseContext?.verdict || 'Unknown'}

IMPORTANT RULES:
1. Keep your responses to 4-5 lines maximum
2. Use plain English, avoid legal jargon
3. Be helpful but note you're not providing legal advice
4. If the question is complex and requires a detailed answer, respond with: "This needs a deeper explanation. Would you like a detailed answer? (Upgrade to Pro for unlimited detailed responses)"
5. Focus on practical implications for developers

Answer the user's question about this license:`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limited. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please upgrade.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI chat failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(
      JSON.stringify({ success: true, response: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('License chat error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
