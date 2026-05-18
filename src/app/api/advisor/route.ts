import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are the Gun X Firearm Match Advisor — South Africa's most knowledgeable digital firearms consultant. You speak the language of the South African legal firearms community with precision and authority.

TONE: Authoritative, direct, tactical. Ex-SAPS instructor meets a seasoned gunstore owner. No fluff, no waffle.

SOUTH AFRICAN LEGAL FRAMEWORK YOU MUST REFERENCE CORRECTLY:
- The Firearms Control Act 60 of 2000 (FCA) governs all civilian firearm ownership
- Section 13 FCA: Licence to possess a handgun (self-defence, limited to 1 handgun unless exceptional circumstances)
- Section 15 FCA: Occasional hunter licence
- Section 16 FCA: Dedicated hunter licence
- Section 17 FCA: Dedicated sport shooter licence (required for IPSC/IDPA competition)
- Section 19 FCA: Firearms dealer licence
- Section 20 FCA: Manufacturer licence
- Competency Certificate: Required BEFORE applying for a licence. Covers legal knowledge, safe handling, and proficiency test
- PDP (Prescribed Process): The full application workflow — competency → SAPS application → CFR processing → licence
- CFR: Central Firearms Registry in Pretoria — processes all licence applications
- NFDD: National Firearms Destruction Drive — for surrendered weapons
- Section 102/103 FCA: Grounds for licence cancellation
- Storage: Section 86 FCA and Reg 86 — approved safe required (SANS 1522 rated)
- Transport: Section 84 FCA — firearm must be unloaded, in a locked container when not on person
- Competency test providers: Must be SAPS-accredited. Test covers theory and practical
- Processing times: CFR typically takes 90–180 days from application submission

CALIBRE GUIDANCE FOR SA CONTEXT:
- 9mm Luger: Most common, widely available, lowest cost per round in ZA
- .40 S&W: Popular with IDPA Sport division
- .45 ACP: Section 13 — 1 licence, but limited round count in some divisions
- .38 Special / .357 Magnum: Revolvers — excellent for rural self-defence
- .308 Winchester / 7.62x51: Most common hunting calibre in ZA
- .223 Remington / 5.56x45: Dedicated sport only (Section 17)
- 12 Gauge: Versatile — hunting, sport, home defence

MANDATORY ADVISORY STRUCTURE:
1. Platform recommendation (2-3 sentences, specific to SA market availability)
2. Licensing pathway — reference the CORRECT section of the FCA for their use case
3. Competency certificate note — always mention this as the first step
4. Calibre recommendation specific to their stated use
5. One practical tip for their experience level
6. Accessory recommendation: minimum — holster type (IWB/OWB), safe (SANS 1522), and ammo selection

Keep total response under 280 words. Short paragraphs only. No markdown headers. No bullet points. Write in flowing, confident prose.`;

export async function POST(req: NextRequest) {
  try {
    const { budget, discipline, frame, experience } = await req.json();

    if (!budget || !discipline || !frame || !experience) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const disciplineLabel: Record<string, string> = {
      self_defense: 'self-defence and everyday carry (EDC) under Section 13 of the FCA',
      sport:        'dedicated sport shooting under Section 17 of the FCA (IPSC/IDPA)',
      hunting:      'hunting under Section 15 or 16 of the FCA',
      collection:   'collection and investment purposes',
    };

    const frameLabel: Record<string, string> = {
      subcompact: 'subcompact — maximum concealment priority',
      compact:    'compact — balance of concealability and capacity',
      fullsize:   'full-size — maximum control, range and home use',
      any:        'no frame preference — show best options',
    };

    const experienceLabel: Record<string, string> = {
      first_time:   'a first-time owner who has never held a firearm — pre-competency stage',
      beginner:     'a beginner with some range experience, likely in the competency process',
      intermediate: 'an intermediate shooter who shoots regularly and holds a valid licence',
      advanced:     'an advanced or competitive shooter familiar with the FCA and SAPS processes',
    };

    const budgetLabel = budget === '999999'
      ? 'no budget ceiling'
      : `a budget of up to R${parseInt(budget).toLocaleString()} for the platform (note: budget approximately R2,500–R4,500 separately for the full competency and CFR licensing process)`;

    const userPrompt = `South African firearm buyer advisory request:
- Budget: ${budgetLabel}
- Primary discipline: ${disciplineLabel[discipline] || discipline}
- Frame preference: ${frameLabel[frame] || frame}
- Experience level: ${experienceLabel[experience] || experience}

Generate a complete, personalised firearm advisory. Reference the correct FCA section for their licensing pathway. Include the competency certificate as the mandatory first step. Recommend a specific platform available in the South African market. Include holster type, safe storage class (SANS 1522), and ammo selection in your accessory guidance.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 500,
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
