import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `You are "Kamila Twin" — a digital twin of Kamila Mishchenko, a Junior Full-Stack JavaScript Developer based in Burgas, Bulgaria.

You answer questions about her career, skills, experience, and professional background on her personal portfolio website. Be friendly, concise, and professional. Speak in first-person as Kamila. When you don't know something, be honest about it rather than inventing facts.

# Profile (Kamila Mishchenko)
- Role: Junior Full-Stack JavaScript Developer
- 5 years of commercial backend experience (PHP)
- Currently focused on React + Node.js full-stack
- Strong in REST APIs, database design, debugging, business systems
- Location: Burgas, Bulgaria
- Email: mis.kamilla@gmail.com
- Phone: +380972225011
- LinkedIn: linkedin.com/in/kamila-m-65bb63236/
- GitHub: github.com/MissKamilla
- Languages: Ukrainian (native), Russian (bilingual), English (A2 — still improving)

# Skills
Frontend: React, JavaScript / TypeScript, TanStack (React Query), React Router, Tailwind CSS, Formik, Axios
Backend: Node.js / NestJS, MySQL / PostgreSQL, TypeORM, REST API / JWT / Swagger, PHP / Laravel / FuelPHP / CodeIgniter
Testing & Tools: Vitest / React Testing Library, Docker, Git / GitHub / GitLab

# Experience
1. Full-Stack JS Internship Project (2025)
   Stack: React, TypeScript, TanStack Query, React Router, Tailwind CSS, Formik, Axios, NestJS, PostgreSQL, TypeORM, Docker, Swagger
   - Built full-stack gallery management app with JWT auth, protected routes, image management
   - Implemented NestJS REST APIs with DTO validation, TypeORM entities, filtering, sorting, pagination
   - Image upload with validation, metadata editing, chunked uploads, concurrency limits
   - Responsive UIs from Figma, extracted reusable UI components
   - Swagger docs + automated frontend/backend tests

2. Backend Developer (PHP · Laravel · FuelPHP · CodeIgniter · MySQL) — 01/2021 to 12/2025, Zaporizhzhya
   - Admin panels and internal business systems
   - REST APIs with auth, validation, pagination, filtering
   - MySQL optimization (indexes, EXPLAIN, query refactoring)
   - PHP version upgrades, third-party integrations, legacy refactoring
   - Collaborated with frontend + backend engineers in Agile environment

# Education
Bachelor in Software Engineering, Zaporizhzhia Institute of Economics and Information Technologies, 2018-2023.

# How to behave
- Keep answers focused (2-4 short paragraphs or a tight bullet list)
- Reference concrete projects, dates, or stack items when relevant
- If asked something personal that isn't in the CV (family, hobbies, salary expectations), politely redirect to professional topics
- Sign or close with a friendly line inviting the visitor to email her for follow-ups
- Use a confident but humble voice — never oversell junior-level experience, but don't undersell it either
- Reply in the same language the user wrote in (English, Ukrainian, or Russian)`;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free, fast, currently-available default on OpenRouter. Override with OPENROUTER_MODEL env var if needed.
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

// Cooldown map so a rate-limited model doesn't get hammered on every retry.
const modelCooldownUntil = new Map<string, number>();

function isOnCooldown(model: string): { on: boolean; retryInSec: number } {
  const until = modelCooldownUntil.get(model);
  if (!until) return { on: false, retryInSec: 0 };
  const ms = until - Date.now();
  if (ms <= 0) {
    modelCooldownUntil.delete(model);
    return { on: false, retryInSec: 0 };
  }
  return { on: true, retryInSec: Math.ceil(ms / 1000) };
}

function putOnCooldown(model: string, seconds: number) {
  modelCooldownUntil.set(model, Date.now() + seconds * 1000);
}

// Ordered fallback list if the default is rate-limited. Keep these short and stable.
const FALLBACK_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-20b:free',
];

function pickModelChain(): string[] {
  const head = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  // De-duplicate while preserving order
  const seen = new Set<string>();
  const chain = [head, ...FALLBACK_MODELS].filter((m) => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
  return chain;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  // Validate and normalize message roles/content
  const sanitized: ChatMessage[] = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0 &&
        m.content.length <= 4000
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (sanitized.length === 0) {
    return NextResponse.json(
      { error: 'No valid messages provided.' },
      { status: 400 }
    );
  }

  const chain = pickModelChain();

  // Find the first model not on cooldown
  let chosenModel: string | null = null;
  for (const m of chain) {
    const cd = isOnCooldown(m);
    if (!cd.on) {
      chosenModel = m;
      break;
    }
  }

  if (!chosenModel) {
    // All models on cooldown — return a friendly error
    const soonest = Math.min(
      ...Array.from(modelCooldownUntil.values()).map((t) => Math.ceil((t - Date.now()) / 1000))
    );
    return NextResponse.json(
      {
        error: 'All free models are rate-limited. Please try again shortly.',
        retryAfterSec: Math.max(soonest, 5),
      },
      { status: 429 }
    );
  }

  const payload = {
    model: chosenModel,
    messages: [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...sanitized],
    temperature: 0.6,
    max_tokens: 500,
    stream: true,
  };

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        // ASCII-only — HTTP header values must be ISO-8859-1 / ByteString
        'X-Title': 'Kamila Mishchenko Portfolio - Digital Twin',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Could not reach OpenRouter.',
        detail: safeDetail(err),
      },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    let detail = '';
    try {
      detail = await upstream.text();
    } catch {
      // ignore
    }

    // Detect rate-limit and put this model on cooldown
    let retryAfterSec = 30;
    try {
      const parsed = JSON.parse(detail);
      const meta = parsed?.error?.metadata;
      if (meta?.retry_after_seconds) retryAfterSec = Number(meta.retry_after_seconds);
      else if (parsed?.error?.message?.includes('rate-limited')) retryAfterSec = 30;
    } catch {
      // body wasn't JSON
    }
    if (upstream.status === 429 || upstream.status === 503) {
      putOnCooldown(chosenModel, retryAfterSec);
    }

    return NextResponse.json(
      {
        error: `Upstream model ${chosenModel} returned ${upstream.status}`,
        detail: detail.slice(0, 1000),
        retryAfterSec,
      },
      { status: 502 }
    );
  }

  // Stream OpenRouter's SSE chunks through to the client as plain text tokens.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';
      let produced = false;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE messages are separated by \n\n
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const token =
                  parsed?.choices?.[0]?.delta?.content ??
                  parsed?.choices?.[0]?.message?.content ??
                  '';
                if (typeof token === 'string' && token.length > 0) {
                  produced = true;
                  controller.enqueue(encoder.encode(token));
                }
              } catch {
                // skip non-JSON keepalives
              }
            }
          }
        }
        // If upstream never produced a token, surface a friendly note
        if (!produced) {
          controller.enqueue(
            encoder.encode(
              "I couldn't get a response from the model just now. Please try again in a moment."
            )
          );
        }
        controller.close();
      } catch (err) {
        try {
          controller.enqueue(
            encoder.encode(
              '\n\n[stream interrupted]'
            )
          );
          controller.close();
        } catch {
          controller.error(err);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Model': chosenModel,
    },
  });
}

function safeDetail(err: unknown): string {
  try {
    const s = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    // Strip non-ASCII just in case downstream JSON serialization chokes
    return s.replace(/[^\x20-\x7E]/g, '?').slice(0, 500);
  } catch {
    return 'unknown error';
  }
}

export async function GET() {
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  const chain = pickModelChain();
  return NextResponse.json({
    ok: true,
    openrouterConfigured: hasKey,
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    fallbackChain: chain,
    endpoint: 'POST /api/chat with { messages: [{role, content}, ...] }',
  });
}