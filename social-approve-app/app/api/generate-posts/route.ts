import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GeneratePostsRequest {
  topic: string;
  additionalContext?: string;
  platform: 'facebook' | 'google_business';
}

interface GeneratedVariation {
  id: number;
  title: string;
  content: string;
  platform: 'facebook' | 'google_business';
}

export async function POST(request: Request) {
  try {
    const body: GeneratePostsRequest = await request.json();
    const { topic, additionalContext, platform } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add GEMINI_API_KEY to environment.' },
        { status: 500 }
      );
    }

    const platformName = platform === 'facebook' ? 'Facebook' : 'Google Business Profile';
    const platformGuidelines = platform === 'facebook'
      ? `- Use emojis strategically (1-3 per post)
- Include a clear call to action
- Keep under 250 words
- Use hashtags (3-5 relevant ones)
- Engaging, conversational tone`
      : `- Professional, informative tone
- Include phone number: 844-967-5247
- Keep concise (under 200 words)
- Focus on local relevance
- Include a "Learn More: [LINK]" or similar CTA`;

    const prompt = `You are a social media content writer for Contractor's Choice Agency, a contractor insurance agency specializing in insurance for contractors (roofing, HVAC, spray foam, plumbing, electrical, etc.).

Generate 3 DISTINCTLY DIFFERENT ${platformName} post variations about the following topic:

Topic: ${topic}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Platform Guidelines for ${platformName}:
${platformGuidelines}

Important brand guidelines:
- Focus on insurance requirements, compliance, and protection
- Use specific examples and numbers when possible
- Address pain points contractors face
- Position CCA as the expert solution
- Include "[LINK]" as placeholder for article links

Generate exactly 3 variations with DIFFERENT approaches:
1. One that's more educational/informative
2. One that emphasizes urgency/consequences of non-compliance
3. One that's solution-focused/benefit-driven

IMPORTANT: Respond ONLY with valid JSON, no markdown or code blocks. Use this exact format:
{"variations":[{"title":"Short title","content":"Post content"},{"title":"Short title","content":"Post content"},{"title":"Short title","content":"Post content"}]}`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`AI service error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();

    // Extract the text content from Gemini response
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      console.error('Unexpected Gemini response structure:', JSON.stringify(geminiData));
      throw new Error('No text content in AI response');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', textContent);
        throw new Error('No JSON found in response');
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent);
      throw new Error('Failed to parse AI response');
    }

    if (!parsedResponse.variations || !Array.isArray(parsedResponse.variations)) {
      console.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response structure from AI');
    }

    // Transform to our format with IDs
    const variations: GeneratedVariation[] = parsedResponse.variations.map(
      (v: { title: string; content: string }, index: number) => ({
        id: index + 1,
        title: v.title || `Variation ${index + 1}`,
        content: v.content || '',
        platform
      })
    );

    return NextResponse.json({ variations });
  } catch (error) {
    console.error('Error generating posts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate post variations' },
      { status: 500 }
    );
  }
}
