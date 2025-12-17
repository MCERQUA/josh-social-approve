import { NextResponse } from 'next/server';
import { getBrandContext, formatBrandContextForPrompt } from '@/lib/brand-context';
import { verifyBrandAccess } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

interface GeneratePostsRequest {
  topic: string;
  additionalContext?: string;
  brand?: string;
}

interface GeneratedVariation {
  id: number;
  title: string;
  content: string;
}

// Fallback context for CCA (default brand)
const CCA_FALLBACK_CONTEXT = `Company: Contractor's Choice Agency
Website: contractorschoiceagency.com
Services: Contractor insurance (roofing, HVAC, spray foam, plumbing, electrical, etc.)
Key Messages:
- Focus on insurance requirements, compliance, and protection
- Use specific examples and numbers when possible
- Address pain points contractors face
- Position CCA as the expert solution
Recommended Hashtags: #ContractorInsurance #RoofingInsurance #HVACInsurance #ContractorProtection`;

export async function POST(request: Request) {
  try {
    const body: GeneratePostsRequest = await request.json();
    const { topic, additionalContext, brand: brandSlug } = body;

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

    // Load brand context
    let brandContext = '';
    let companyName = "Contractor's Choice Agency";
    let website = 'contractorschoiceagency.com';
    let hashtags = '#ContractorInsurance #RoofingInsurance #HVACInsurance #ContractorProtection';

    if (brandSlug) {
      // Verify brand access
      const brand = await verifyBrandAccess(brandSlug);
      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found or access denied' },
          { status: 403 }
        );
      }

      // Load full brand context
      const context = await getBrandContext(brandSlug);
      if (context) {
        brandContext = formatBrandContextForPrompt(context);
        companyName = context.name;
        website = context.companyInfo.website || context.website_url || website;
        if (context.brandGuidelines.hashtags.length > 0) {
          hashtags = context.brandGuidelines.hashtags.join(' ');
        }
      } else {
        brandContext = CCA_FALLBACK_CONTEXT;
      }
    } else {
      brandContext = CCA_FALLBACK_CONTEXT;
    }

    // Platform guidelines
    const platformGuidelines = `- Use emojis strategically (1-3 per post)
- Include a clear call to action with link to ${website}
- Keep under 250 words
- Use hashtags (3-5 relevant ones from: ${hashtags})
- Engaging, conversational tone
- IMPORTANT: Use line breaks (\\n\\n) to separate paragraphs for readability
- Structure: Hook/question -> Main content -> CTA with website -> Hashtags (each on separate lines)`;

    const prompt = `You are a social media content writer for ${companyName}.

=== COMPANY CONTEXT ===
${brandContext}

=== YOUR TASK ===
Generate 3 DISTINCTLY DIFFERENT social media post variations about the following topic:

Topic: ${topic}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

=== PLATFORM GUIDELINES ===
${platformGuidelines}

=== VARIATION REQUIREMENTS ===
Generate exactly 3 variations with DIFFERENT approaches:
1. One that's more educational/informative
2. One that emphasizes urgency or the problem being solved
3. One that's solution-focused/benefit-driven

=== CRITICAL FORMATTING RULES ===
- Each post MUST have multiple paragraphs separated by blank lines
- Use \\n\\n in the JSON to create line breaks between sections
- Never write posts as a single wall of text
- Use the company's actual website URL, not placeholder text
- Include relevant hashtags from the brand guidelines
- Example structure for Facebook:
  "Hook question or statement\\n\\nMain content paragraph explaining the topic.\\n\\nCall to action: Visit ${website}\\n\\n#Hashtag1 #Hashtag2"

=== IMPORTANT ===
- Stay true to the company's voice, services, and service areas
- Use specific details from the company context above
- Reference actual services and unique selling points

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
        content: v.content || ''
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
