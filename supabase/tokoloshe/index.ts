import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
);

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') || '+14155238886';
const ADMIN_WHATSAPP = Deno.env.get('ADMIN_WHATSAPP') || '+27614325574';
const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are Tokoloshe — the autonomous AI Sentinel for Gun X, South Africa's premier legal firearms classifieds marketplace.

YOUR CHARACTER:
- Sharp, witty, authentic South African tone. Use SA expressions naturally.
- Protective and fiercely loyal to Gun X and its admin Kgofu
- Zero tolerance for illegal activity, scams, or threats
- Proactive — you don't wait to be asked, you act
- You have a dry sense of humour but you are deadly serious about security

THE TOKOLOSHE PROTOCOL:
- You NEVER delete users, listings, or data without explicit "Clear to Fire" confirmation from Kgofu
- You flag, pause, and alert — but you wait for human confirmation before permanent destructive actions
- You treat every suspicious listing as guilty until proven innocent
- Revenue protection is sacred — you chase every rand

FIREARMS CONTROL ACT KNOWLEDGE:
- All firearm transfers require a SAPS-registered dealer
- Prohibited: unlicensed modifications, silencers, fully automatic conversions
- Red flag keywords: "no serial", "untraceable", "ghost gun", "suppressor", "full auto", "illegal mod", "convert to auto", "unregistered", "stolen", "no paperwork"

YOUR RESPONSE FORMAT for autonomous tasks:
Always respond as valid JSON:
{
  "summary": "One-line SA-flavoured status",
  "level": "info | warning | critical",
  "category": "security | moderation | revenue | traffic | system",
  "findings": ["finding 1", "finding 2"],
  "actions_taken": ["action 1"],
  "recommendations": ["rec 1"],
  "decision_cards": [
    {
      "id": "unique_id",
      "title": "Card title",
      "description": "What happened and what action is proposed",
      "action_yes": "What YES does",
      "action_no": "What NO does",
      "entity_type": "listing | dealer | ad | invoice",
      "entity_id": "uuid",
      "urgency": "high | medium | low"
    }
  ],
  "requires_admin_attention": true,
  "urgent_message": "WhatsApp message if critical, null if not"
}`;

// ============================================
// WHATSAPP via Twilio
// ============================================
async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const body = new URLSearchParams({
      From: `whatsapp:${TWILIO_FROM}`,
      To: `whatsapp:${to}`,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    console.log('WhatsApp sent:', result.sid || result.message);
    return response.ok;
  } catch (err: any) {
    console.error('WhatsApp error:', err.message);
    return false;
  }
}

// ============================================
// DECISION CARDS — store for admin dashboard
// ============================================
async function saveDecisionCards(cards: any[], taskName: string) {
  if (!cards || cards.length === 0) return;

  for (const card of cards) {
    await supabase.from('sentinel_logs').insert({
      level: card.urgency === 'high' ? 'critical' : 'warning',
      category: 'decision',
      action_taken: card.title,
      reasoning: card.description,
      metadata: {
        decision_card: true,
        card_id: card.id,
        action_yes: card.action_yes,
        action_no: card.action_no,
        entity_type: card.entity_type,
        entity_id: card.entity_id,
        urgency: card.urgency,
        task: taskName,
      },
      resolved: false,
    });
  }
}

// ============================================
// DATA GATHERING
// ============================================
async function gatherIntelligence(task: string) {
  const now = new Date();
  const hour_ago = new Date(now.getTime() - 60 * 60000).toISOString();
  const day_ago = new Date(now.getTime() - 24 * 60 * 60000).toISOString();

  switch (task) {

    case 'security_scan': {
      const { data: sessions } = await supabase
        .from('active_sessions')
        .select('session_id, page, last_seen')
        .gte('last_seen', hour_ago);

      const sessionCounts: Record<string, number> = {};
      (sessions || []).forEach((s: any) => {
        sessionCounts[s.session_id] = (sessionCounts[s.session_id] || 0) + 1;
      });

      const { data: newListings } = await supabase
        .from('listings')
        .select('id, title, description, status, created_at')
        .eq('status', 'active')
        .gte('created_at', day_ago);

      const { data: bannedIps } = await supabase
        .from('banned_ips')
        .select('ip_address, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        active_sessions: sessions?.length || 0,
        high_activity_sessions: Object.values(sessionCounts).filter((c: any) => c > 20).length,
        new_listings_24h: newListings?.length || 0,
        recent_listings: newListings?.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description?.slice(0, 200),
        })),
        recent_bans: bannedIps || [],
        task,
      };
    }

    case 'listing_moderation': {
      const PROHIBITED = [
        'no serial', 'untraceable', 'ghost gun', 'suppressor', 'silencer',
        'full auto', 'fully automatic', 'illegal mod', 'convert to auto',
        'unregistered', 'stolen', 'no paperwork', 'cash only no questions',
        'no licence needed', 'no license needed',
      ];

      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, description, status, created_at, seller_id')
        .eq('status', 'active')
        .gte('created_at', day_ago);

      const flagged = (listings || []).filter((l: any) => {
        const text = `${l.title} ${l.description}`.toLowerCase();
        return PROHIBITED.some(kw => text.includes(kw));
      });

      // Auto-pause flagged listings
      for (const listing of flagged) {
        await supabase.from('listings').update({ status: 'pending_review' }).eq('id', listing.id);
        await supabase.from('audit_log').insert({
          action: 'listing_auto_flagged',
          entity_type: 'listing',
          entity_id: listing.id,
          actor_type: 'tokoloshe',
          details: { title: listing.title, reason: 'Prohibited keyword detected' },
        });
      }

      return {
        total_active_listings: listings?.length || 0,
        flagged_count: flagged.length,
        flagged_listings: flagged.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description?.slice(0, 300),
        })),
        task,
      };
    }

    case 'revenue_check': {
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, client_email, total, due_date')
        .in('status', ['unpaid', 'overdue'])
        .lt('due_date', now.toISOString().slice(0, 10));

      const { data: expiringAds } = await supabase
        .from('ads')
        .select('id, title, client_name, client_email, expires_at, impressions, clicks, amount_paid, rate_per_day')
        .eq('status', 'active')
        .lt('expires_at', new Date(now.getTime() + 3 * 86400000).toISOString())
        .gt('expires_at', now.toISOString());

      const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('id, client_name, amount, status, next_billing_date')
        .eq('status', 'active');

      return {
        overdue_invoices: (overdueInvoices || []).map((i: any) => ({
          id: i.id,
          invoice_number: i.invoice_number,
          client_name: i.client_name,
          client_email: i.client_email,
          total: i.total,
          due_date: i.due_date,
        })),
        overdue_total: (overdueInvoices || []).reduce((s: number, i: any) => s + (i.total || 0), 0),
        expiring_ads: (expiringAds || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          client_name: a.client_name,
          client_email: a.client_email,
          expires_at: a.expires_at,
          impressions: a.impressions,
          renewal_value: a.rate_per_day ? a.rate_per_day * 14 : 500,
        })),
        mrr: (activeSubs || []).reduce((s: number, sub: any) => s + (sub.amount || 0), 0),
        task,
      };
    }

    case 'traffic_analysis': {
      const { data: todayViews } = await supabase
        .from('page_views')
        .select('page, device')
        .gte('created_at', day_ago);

      const { data: yesterdayViews } = await supabase
        .from('page_views')
        .select('id')
        .gte('created_at', new Date(now.getTime() - 48 * 60 * 60000).toISOString())
        .lt('created_at', day_ago);

      const pageCounts: Record<string, number> = {};
      (todayViews || []).forEach((v: any) => {
        pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
      });

      const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const changePercent = yesterdayViews?.length
        ? Math.round(((todayViews?.length || 0) - yesterdayViews.length) / yesterdayViews.length * 100)
        : 0;

      return {
        views_today: todayViews?.length || 0,
        views_yesterday: yesterdayViews?.length || 0,
        change_percent: changePercent,
        top_pages: topPages,
        task,
      };
    }

    case 'morning_brief':
    case 'daily_brief':
    default: {
      const [listings, dealers, invoices, subs, ads, views, pending] = await Promise.all([
        supabase.from('listings').select('id').eq('status', 'active'),
        supabase.from('dealers').select('id').eq('status', 'approved'),
        supabase.from('invoices').select('total').in('status', ['unpaid', 'overdue']),
        supabase.from('subscriptions').select('amount').eq('status', 'active'),
        supabase.from('ads').select('id').eq('status', 'active'),
        supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', day_ago),
        supabase.from('dealers').select('id').eq('status', 'pending'),
      ]);

      return {
        active_listings: listings.data?.length || 0,
        approved_dealers: dealers.data?.length || 0,
        pending_dealers: pending.data?.length || 0,
        outstanding_invoices: invoices.data?.length || 0,
        outstanding_amount: (invoices.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0),
        mrr: (subs.data || []).reduce((s: number, sub: any) => s + (sub.amount || 0), 0),
        active_ads: ads.data?.length || 0,
        views_today: views.count || 0,
        date: now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }),
        time: now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        task,
      };
    }
  }
}

// ============================================
// CLAUDE BRAIN
// ============================================
async function thinkWithClaude(data: any, userPrompt?: string): Promise<any> {
  const prompt = userPrompt ||
    `Analyse this Gun X platform data and provide your full assessment with any decision cards needed: ${JSON.stringify(data, null, 2)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic error:', response.status, errText);
      return {
        summary: `API error ${response.status}`,
        level: 'warning',
        category: 'system',
        findings: [errText.slice(0, 200)],
        actions_taken: [],
        recommendations: [],
        decision_cards: [],
        requires_admin_attention: false,
        urgent_message: null,
      };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '{}';
    console.log('Claude response (first 400):', text.slice(0, 400));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON parse error');
      }
    }

    return {
      summary: text.slice(0, 200),
      level: 'info',
      category: 'system',
      findings: [],
      actions_taken: [],
      recommendations: [],
      decision_cards: [],
      requires_admin_attention: false,
      urgent_message: null,
    };

  } catch (err: any) {
    console.error('thinkWithClaude error:', err.message);
    return {
      summary: `Error: ${err.message}`,
      level: 'warning',
      category: 'system',
      findings: [],
      actions_taken: [],
      recommendations: [],
      decision_cards: [],
      requires_admin_attention: false,
      urgent_message: null,
    };
  }
}

// ============================================
// EXECUTE ACTIONS
// ============================================
async function executeActions(task: string, analysis: any, data: any) {
  const actions: string[] = [];

  // Save decision cards to sentinel_logs
  if (analysis.decision_cards?.length > 0) {
    await saveDecisionCards(analysis.decision_cards, task);
    actions.push(`${analysis.decision_cards.length} decision card(s) created`);
  }

  // Send WhatsApp for critical events
  if (analysis.urgent_message && analysis.level === 'critical') {
    const sent = await sendWhatsApp(
      ADMIN_WHATSAPP,
      `👁️ *TOKOLOSHE ALERT*\n\n${analysis.urgent_message}\n\n_Gun X Sentinel_`
    );
    if (sent) actions.push('WhatsApp alert sent to admin');
  }

  // Log to sentinel_logs
  try {
    await supabase.from('sentinel_logs').insert({
      level: analysis.level || 'info',
      category: analysis.category || task,
      action_taken: actions.join('; ') || analysis.actions_taken?.join('; ') || 'Monitoring complete',
      reasoning: analysis.summary,
      metadata: {
        findings: analysis.findings || [],
        recommendations: analysis.recommendations || [],
        actions_executed: actions,
        data_snapshot: {
          task,
          timestamp: new Date().toISOString(),
        },
      },
      resolved: analysis.level === 'info',
    });
  } catch (logErr: any) {
    console.error('Sentinel log error:', logErr.message);
  }

  return actions;
}

// ============================================
// MORNING BRIEF
// ============================================
async function sendMorningBrief() {
  const data = await gatherIntelligence('morning_brief');
  const analysis = await thinkWithClaude(data,
    `Generate a morning tactical briefing for Gun X admin Kgofu. 
     Be sharp, direct, South African. Include:
     - Overall platform health (1 line)
     - Revenue status
     - Any urgent items
     - One strategic suggestion for today
     Data: ${JSON.stringify(data, null, 2)}`
  );

  const briefText = `🌅 *GUN X MORNING BRIEF*
${data.date} | ${data.time}

📊 *Platform Status*
- Active listings: ${data.active_listings}
- Dealers: ${data.approved_dealers} active${data.pending_dealers > 0 ? `, ${data.pending_dealers} pending ⚠️` : ''}
- Traffic today: ${data.views_today} views
- Active ads: ${data.active_ads}

💰 *Revenue*
- MRR: R${data.mrr?.toLocaleString() || 0}
- Outstanding: R${data.outstanding_amount?.toLocaleString() || 0} (${data.outstanding_invoices} invoices)

🧠 *Tokoloshe Says*
${analysis.summary || 'All systems operational, Boss.'}

${analysis.recommendations?.[0] ? `💡 *Today's Suggestion*\n${analysis.recommendations[0]}` : ''}

_Reply with any command. I'm watching. 👁️_`;

  await sendWhatsApp(ADMIN_WHATSAPP, briefText);

  await supabase.from('sentinel_logs').insert({
    level: 'info',
    category: 'system',
    action_taken: 'Morning brief sent via WhatsApp',
    reasoning: analysis.summary,
    metadata: { data, analysis },
    resolved: true,
  });

  return { brief: briefText, analysis };
}

// ============================================
// HANDLE ADMIN CHAT
// ============================================
async function handleAdminChat(message: string): Promise<string> {
  try {
    const { data: history } = await supabase
      .from('sentinel_chat')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(10);

    const chatHistory = (history || []).reverse();

    const [listings, dealers, invoices, ads, recentLogs] = await Promise.all([
      supabase.from('listings').select('id').eq('status', 'active'),
      supabase.from('dealers').select('business_name, subscription_tier').eq('status', 'approved'),
      supabase.from('invoices').select('invoice_number, client_name, total, status').limit(5).order('created_at', { ascending: false }),
      supabase.from('ads').select('title, client_name, impressions').eq('status', 'active'),
      supabase.from('sentinel_logs').select('level, action_taken, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const context = `
LIVE GUN X DATA (${new Date().toLocaleString('en-ZA')}):
- Active listings: ${listings.data?.length || 0}
- Approved dealers: ${dealers.data?.map((d: any) => `${d.business_name} (${d.subscription_tier})`).join(', ') || 'None'}
- Recent invoices: ${invoices.data?.map((i: any) => `${i.invoice_number}: ${i.client_name} R${i.total} (${i.status})`).join(', ') || 'None'}
- Active ads: ${ads.data?.map((a: any) => `${a.title} — ${a.impressions} impressions`).join(', ') || 'None'}
- Recent sentinel activity: ${recentLogs.data?.map((l: any) => `[${l.level}] ${l.action_taken}`).join(', ') || 'None'}
`;

    const messages = [
      ...chatHistory.map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: `${context}\n\nAdmin Kgofu says: ${message}` },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: `${SYSTEM_PROMPT}\n\nIn chat mode, respond conversationally in plain text (not JSON). Be direct, sharp, South African. Max 3 paragraphs. If asked to do something, confirm what action you will take and do it if it is safe and non-destructive.`,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return `Eish, API hiccup (${response.status}). Try again Boss.`;
    }

    const result = await response.json();
    const reply = result.content?.[0]?.text || 'Haibo, something went wrong. Try again.';

    await supabase.from('sentinel_chat').insert([
      { role: 'user', content: message },
      { role: 'assistant', content: reply },
    ]);

    return reply;

  } catch (err: any) {
    console.error('Chat error:', err.message);
    return `Eish, I hit an error: ${err.message}`;
  }
}

// ============================================
// HANDLE WHATSAPP REPLY (inbound webhook)
// ============================================
async function handleWhatsAppReply(body: string): Promise<string> {
  const params = new URLSearchParams(body);
  const from = params.get('From') || '';
  const message = params.get('Body') || '';

  console.log('WhatsApp reply from:', from, 'message:', message);

  // Only respond to admin
  if (!from.includes(ADMIN_WHATSAPP.replace('+', ''))) {
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  const reply = await handleAdminChat(message);

  // Send reply back via WhatsApp
  await sendWhatsApp(ADMIN_WHATSAPP, `👁️ *Tokoloshe*\n\n${reply}`);

  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

// ============================================
// EXECUTE DECISION CARD ACTION
// ============================================
async function executeDecisionCard(cardId: string, action: 'yes' | 'no', logId: string) {
  const { data: log } = await supabase
    .from('sentinel_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (!log) return { error: 'Card not found' };

  const card = log.metadata?.decision_card ? log.metadata : null;
  if (!card) return { error: 'No decision card in log' };

  let result = '';

  if (action === 'yes') {
    const entityType = log.metadata?.entity_type;
    const entityId = log.metadata?.entity_id;

    if (entityType === 'listing' && entityId) {
      await supabase.from('listings').update({ status: 'active' }).eq('id', entityId);
      result = `Listing ${entityId} restored to active`;
    } else if (entityType === 'ad' && entityId) {
      // Extend ad by 14 days
      const newExpiry = new Date(Date.now() + 14 * 86400000).toISOString();
      await supabase.from('ads').update({ expires_at: newExpiry, expiry_notified: false }).eq('id', entityId);
      result = `Ad ${entityId} extended by 14 days`;
    }
  } else {
    result = `Decision card ${cardId} dismissed`;
  }

  // Mark log as resolved
  await supabase.from('sentinel_logs').update({ resolved: true }).eq('id', logId);

  await supabase.from('audit_log').insert({
    action: `decision_card_${action}`,
    entity_type: log.metadata?.entity_type || 'unknown',
    entity_id: log.metadata?.entity_id || logId,
    actor_type: 'admin',
    details: { card_id: cardId, action, result },
  });

  return { success: true, result };
}

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // WhatsApp webhook — Twilio sends form-encoded POST
  const contentType = req.headers.get('content-type') || '';
  if (req.method === 'POST' && contentType.includes('application/x-www-form-urlencoded')) {
    const body = await req.text();
    const twiml = await handleWhatsAppReply(body);
    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { task, message, mode, decision_card_id, decision_action, log_id } = body;

    console.log('Tokoloshe request:', { mode, task, hasMessage: !!message });

    // DECISION CARD ACTION
    if (decision_card_id && decision_action) {
      const result = await executeDecisionCard(decision_card_id, decision_action, log_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CHAT MODE
    if (mode === 'chat' && message) {
      const reply = await handleAdminChat(message);
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MORNING BRIEF
    if (task === 'morning_brief') {
      const result = await sendMorningBrief();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AUTONOMOUS TASK
    const taskToRun = task || 'daily_brief';
    console.log('Running task:', taskToRun);

    const data = await gatherIntelligence(taskToRun);
    const analysis = await thinkWithClaude(data);
    const actions = await executeActions(taskToRun, analysis, data);

    await supabase.from('sentinel_tasks').upsert({
      task_name: taskToRun,
      last_run: new Date().toISOString(),
      next_run: new Date(Date.now() + 60 * 60000).toISOString(),
      status: 'completed',
      result: { analysis, actions },
    }, { onConflict: 'task_name' });

    return new Response(JSON.stringify({ analysis, actions, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Main handler error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});