import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { validateLead, type Lead, type LeadInput } from "@/lib/lead";

export const dynamic = "force-dynamic";

const hits = new Map<string, { count: number; reset: number }>();
const seen = new Set<string>();

function limited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + 60 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 8;
}

function ledgerPath() {
  return path.join(process.cwd(), "data", "leads.jsonl");
}

async function knownEmail(email: string) {
  if (seen.has(email)) return true;
  try {
    const raw = await readFile(ledgerPath(), "utf8");
    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        const row = JSON.parse(line) as { email?: string };
        if (row.email === email) {
          seen.add(email);
          return true;
        }
      } catch {
        continue;
      }
    }
  } catch {
    return false;
  }
  return false;
}

async function saveLocal(lead: Lead) {
  const dir = path.dirname(ledgerPath());
  await mkdir(dir, { recursive: true });
  await appendFile(ledgerPath(), JSON.stringify(lead) + "\n", "utf8");
  seen.add(lead.email);
}

async function saveSheet(lead: Lead) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return false;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(lead),
    redirect: "follow",
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: { ok?: boolean; duplicate?: boolean } = {};
  try {
    parsed = JSON.parse(text) as { ok?: boolean; duplicate?: boolean };
  } catch {
    parsed = {};
  }

  if (!response.ok || parsed.ok === false) {
    throw new Error("Sheet rejected the application");
  }
  if (parsed.duplicate) {
    const error = new Error("duplicate");
    error.name = "Duplicate";
    throw error;
  }
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return Response.json(
      { ok: false, errors: { form: "Too many attempts. Try again in a moment." } },
      { status: 429 },
    );
  }

  let body: Partial<LeadInput>;
  try {
    body = (await request.json()) as Partial<LeadInput>;
  } catch {
    return Response.json({ ok: false, errors: { form: "Could not read that." } }, { status: 400 });
  }

  const result = validateLead(body);
  if ("honeypot" in result) return Response.json({ ok: true });
  if ("errors" in result) return Response.json({ ok: false, errors: result.errors }, { status: 400 });

  const lead = result.lead;

  try {
    if (await knownEmail(lead.email)) {
      return Response.json(
        { ok: false, errors: { email: "An application with this email is already in.", form: "This email already has an application." } },
        { status: 409 },
      );
    }

    seen.add(lead.email);
    const sentToSheet = await saveSheet(lead);
    await saveLocal(lead);

    if (process.env.SHEETS_WEBHOOK_URL && !sentToSheet) {
      return Response.json(
        { ok: false, errors: { form: "We couldn’t record your application. Try again." } },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    seen.delete(lead.email);
    if (error instanceof Error && error.name === "Duplicate") {
      seen.add(lead.email);
      return Response.json(
        { ok: false, errors: { email: "An application with this email is already in.", form: "This email already has an application." } },
        { status: 409 },
      );
    }
    return Response.json(
      { ok: false, errors: { form: "We couldn’t record your application. Try again." } },
      { status: 502 },
    );
  }
}
