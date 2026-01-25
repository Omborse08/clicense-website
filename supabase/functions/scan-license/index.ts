const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scanning license for URL:', url);

    // Step 1: Scrape the page using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const scrapeError = await scrapeResponse.text();
      console.error('Firecrawl error:', scrapeError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch page content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    console.log('Page scraped, content length:', pageContent.length);

    // Step 2: Analyze with AI
    const systemPrompt = `You are a license analysis expert. Analyze the provided content from a repository or model page and extract license information.

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "licenseName": "string - the name of the license (e.g., 'Apache 2.0', 'MIT', 'GPL-3.0', 'Llama 2 Community License')",
  "licenseType": "Open Source" | "Research Only" | "Restricted",
  "commercialUse": "yes" | "no" | "conditional",
  "modificationAllowed": true | false,
  "redistributionAllowed": true | false,
  "risks": ["array of plain English bullet points about requirements and restrictions"],
  "verdict": "one sentence summary of whether it can be used commercially",
  "verdictType": "safe" | "warning" | "danger"
}

Guidelines for classification:
- "Open Source" = permissive licenses like MIT, Apache, BSD that allow commercial use
- "Research Only" = licenses that explicitly restrict to non-commercial/research use
- "Restricted" = proprietary or heavily restricted licenses

- commercialUse "yes" = can freely use in commercial products
- commercialUse "conditional" = commercial use allowed with conditions (attribution, share-alike, etc.)
- commercialUse "no" = commercial use not allowed

- verdictType "safe" = clear for commercial use with minimal requirements
- verdictType "warning" = conditional or unclear, needs attention
- verdictType "danger" = not allowed for commercial use

Be accurate and thorough. If you cannot determine the license, say "Unknown License" and set verdictType to "warning".`;

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
          { role: 'user', content: `Analyze this page content and extract license information:\n\nURL: ${url}\nTitle: ${metadata.title || 'Unknown'}\n\nContent:\n${pageContent.substring(0, 15000)}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const aiError = await aiResponse.text();
      console.error('AI error:', aiError);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limited. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    console.log('AI response:', content);

    // Parse the JSON response
    let licenseInfo;
    try {
      // Clean up potential markdown code blocks
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      licenseInfo = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a default response if parsing fails
      licenseInfo = {
        licenseName: 'Unknown License',
        licenseType: 'Restricted',
        commercialUse: 'conditional',
        modificationAllowed: false,
        redistributionAllowed: false,
        risks: ['Could not determine license automatically', 'Manual review recommended'],
        verdict: 'License could not be automatically determined. Please review manually.',
        verdictType: 'warning',
      };
    }

    // Determine source from URL
    let source = 'Other';
    if (url.includes('huggingface.co')) {
      source = 'Hugging Face';
    } else if (url.includes('github.com')) {
      source = 'GitHub';
    } else if (url.includes('gitlab.com')) {
      source = 'GitLab';
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...licenseInfo,
          source,
          url,
          title: metadata.title || url,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('License scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
