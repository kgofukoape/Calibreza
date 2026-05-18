import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are the Gun X Firearm Match Advisor — a knowledgeable, professional South African firearms consultant. You provide tactical, concise advisory to first-time and experienced firearm buyers on the South African market.

Your tone is: authoritative, direct, tactical. No fluff. Think ex-SAPS instructor meets premium gunstore consultant.

Always include:
1. A brief platform recommendation based on their inputs (2-3 sentences)
2. Calibre guidance specific to their use case (1-2 sentences)  
3. One practical tip for their experience level (1 sentence)
4. A brief legal reminder about SA licensing (1 sentence)

Keep response under 200 words. Use short paragraphs. No bullet points. No markdown headers.`;

export async function POST(req: NextRequest) {
  try {
    const { budget, discipline, frame, experience } = await req.json();

    if (!budget || !discipline || !frame || !experience) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const disciplineLabel: Record<string, string> = {
      self_defense: 'self-defence and everyday carry (EDC)',
      sport:        'sport shooting and competition (IDPA/IPSC)',
      hunting:      'hunting and field use',
      collection:   'collection and investment',
    };

    const frameLabel: Record<string, string> = {
      subcompact: 'subcompact',
      compact:    'compact',
      fullsize:   'full-size',
      any:        'any frame size',
    };

    const experienceLabel: Record<string, string> = {
      first_time:   'first-time owner with no prior experience',
      beginner:     'beginner with some range experience',
      intermediate: 'intermediate shooter who shoots regularly',
      advanced:     'advanced or competitive shooter',
    };

    const budgetLabel = budget === '999999' ? 'no budget limit' : `a budget of up to R${parseInt(budget).toLocaleString()}`;

    const userPrompt = `Advisory request for a South African firearms buyer:
- Budget: ${budgetLabel}
- Primary use: ${disciplineLabel[discipline] || discipline}
- Preferred frame size: ${frameLabel[frame] || frame}
- Experience level: ${experienceLabel[experience] || experience}

Provide a personalised firearm advisory for this buyer. Be specific to the South African market and legal framework.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return NextResponse.json({ advisory: text });
  } catch (err: any) {
    console.error('Advisor API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
