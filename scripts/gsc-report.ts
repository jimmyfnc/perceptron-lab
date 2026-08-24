#!/usr/bin/env bun
/**
 * gsc-report.ts — Google Search Console reports from the terminal, zero deps.
 *
 * Auth is a service account (API keys cannot read GSC data): point
 * GOOGLE_APPLICATION_CREDENTIALS in .env at the service account's JSON key,
 * enable "Google Search Console API" on its Cloud project, and add the
 * account's client_email as a user on each property you want to query.
 * Works for any site/property — not just this repo's.
 *
 *   bun scripts/gsc-report.ts                  # auto-picks the only site, full report
 *   bun scripts/gsc-report.ts --sites          # list properties the account can see
 *   bun scripts/gsc-report.ts --site sc-domain:example.com --days 90 --limit 50
 *   bun scripts/gsc-report.ts --dim page,device
 *   bun scripts/gsc-report.ts --sitemaps       # sitemap processing status
 *   bun scripts/gsc-report.ts --inspect https://a.com/x,https://a.com/y
 *   bun scripts/gsc-report.ts --submit-sitemap https://a.com/sitemap.xml
 */
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://searchconsole.googleapis.com/webmasters/v3";
// full (not readonly) scope so --submit-sitemap works; reads are unaffected
const SCOPE = "https://www.googleapis.com/auth/webmasters";

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name: string) => args.includes(`--${name}`);

const days = Number(flag("days") ?? 28);
const limit = Number(flag("limit") ?? 20);
const keyPath = flag("key") ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (has("help")) {
  console.log(
    "usage: bun scripts/gsc-report.ts [--sites] [--site <property>] [--days N] " +
      "[--limit N] [--dim query,page,date,country,device] [--key path.json]",
  );
  process.exit(0);
}

if (!keyPath) {
  console.error(
    "No credentials. Set GOOGLE_APPLICATION_CREDENTIALS in .env to the path of a\n" +
      "service-account JSON key (e.g. ./service-account.json), or pass --key <path>.\n" +
      "Setup: enable 'Google Search Console API' on the key's Cloud project, then in\n" +
      "Search Console add the service account email as a user on your property.",
  );
  process.exit(1);
}

// ---- auth: service-account JWT -> access token ------------------------------
interface ServiceAccount {
  client_email: string;
  private_key: string;
}

let sa: ServiceAccount;
try {
  sa = JSON.parse(readFileSync(keyPath, "utf8"));
} catch (e) {
  console.error(`Could not read service-account key at ${keyPath}: ${e}`);
  process.exit(1);
}
if (!sa.client_email || !sa.private_key) {
  console.error(`${keyPath} is not a service-account key (need client_email + private_key).`);
  process.exit(1);
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) +
    "." +
    b64url(
      JSON.stringify({
        iss: sa.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    );
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`token exchange failed: ${body.error_description ?? res.status}`);
  }
  return body.access_token;
}

// ---- API calls --------------------------------------------------------------
let token = "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (res.status === 403) {
    throw new Error(
      `403 forbidden — either the Search Console API isn't enabled on the Cloud\n` +
        `project, or ${sa.client_email} hasn't been added as a user on this property.`,
    );
  }
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

/** URL Inspection API — authoritative per-URL index status. */
async function inspect(site: string, url: string) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
  });
  if (!res.ok) throw new Error(`inspect ${url} -> ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as {
    inspectionResult?: {
      indexStatusResult?: {
        verdict?: string;
        coverageState?: string;
        lastCrawlTime?: string;
        robotsTxtState?: string;
        googleCanonical?: string;
      };
    };
  };
  return j.inspectionResult?.indexStatusResult ?? {};
}

interface Row {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function query(site: string, dimensions: string[], rowLimit: number): Promise<Row[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const body = await api<{ rows?: Row[] }>(
    `/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: "POST",
      body: JSON.stringify({
        startDate: iso(start),
        endDate: iso(end),
        dimensions,
        rowLimit,
      }),
    },
  );
  return body.rows ?? [];
}

// ---- report -----------------------------------------------------------------
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const table = (rows: Row[], label: string) => {
  if (!rows.length) return console.log(`  (no ${label} rows)`);
  const w = Math.min(64, Math.max(...rows.map((r) => (r.keys?.join(" · ") ?? "").length), 5));
  console.log(`  ${label.padEnd(w)}  clicks  impressions   ctr   position`);
  for (const r of rows) {
    const key = (r.keys?.join(" · ") ?? "—").slice(0, w);
    console.log(
      `  ${key.padEnd(w)}  ${String(r.clicks).padStart(6)}  ${String(r.impressions).padStart(11)}` +
        `  ${pct(r.ctr).padStart(5)}  ${r.position.toFixed(1).padStart(8)}`,
    );
  }
};

try {
  token = await accessToken();

  const { siteEntry = [] } = await api<{
    siteEntry?: { siteUrl: string; permissionLevel: string }[];
  }>("/sites");

  if (has("sites")) {
    if (!siteEntry.length) console.log(`No properties visible to ${sa.client_email} yet.`);
    for (const s of siteEntry) console.log(`${s.siteUrl}  (${s.permissionLevel})`);
    process.exit(0);
  }

  let site = flag("site");
  if (!site) {
    if (siteEntry.length === 1) {
      site = siteEntry[0].siteUrl;
    } else if (!siteEntry.length) {
      throw new Error(
        `no properties are shared with ${sa.client_email} — add it as a user in Search Console.`,
      );
    } else {
      console.log("Multiple properties — pick one with --site:");
      for (const s of siteEntry) console.log(`  ${s.siteUrl}`);
      process.exit(1);
    }
  }

  if (has("sitemaps")) {
    const { sitemap = [] } = await api<{
      sitemap?: {
        path: string;
        lastSubmitted?: string;
        lastDownloaded?: string;
        isPending?: boolean;
        errors?: string;
        warnings?: string;
        contents?: { type: string; submitted: string; indexed: string }[];
      }[];
    }>(`/sites/${encodeURIComponent(site)}/sitemaps`);
    if (!sitemap.length) console.log(`no sitemaps submitted for ${site}`);
    for (const s of sitemap) {
      console.log(`${s.path}`);
      console.log(
        `  submitted ${s.lastSubmitted ?? "—"} · last downloaded ${s.lastDownloaded ?? "never"}` +
          ` · pending ${s.isPending ?? false} · errors ${s.errors ?? 0} · warnings ${s.warnings ?? 0}`,
      );
      for (const c of s.contents ?? []) console.log(`  ${c.type}: ${c.submitted} URLs submitted`);
    }
    process.exit(0);
  }

  const sitemapToSubmit = flag("submit-sitemap");
  if (sitemapToSubmit) {
    await api(
      `/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemapToSubmit)}`,
      { method: "PUT" },
    );
    console.log(`resubmitted ${sitemapToSubmit} for ${site}`);
    process.exit(0);
  }

  const inspectUrls = flag("inspect");
  if (inspectUrls) {
    for (const u of inspectUrls.split(",")) {
      const r = await inspect(site, u.trim());
      const crawl = r.lastCrawlTime ? r.lastCrawlTime.slice(0, 16).replace("T", " ") : "never";
      console.log(`${u.trim()}`);
      console.log(`  ${r.verdict ?? "?"} · ${r.coverageState ?? "?"} · last crawl ${crawl}`);
      if (r.googleCanonical && r.googleCanonical !== u.trim())
        console.log(`  google canonical: ${r.googleCanonical}`);
    }
    process.exit(0);
  }

  console.log(`\n${site} — last ${days} days\n`);

  const dims = flag("dim");
  if (dims) {
    table(await query(site, dims.split(","), limit), dims);
  } else {
    const [totals] = await query(site, [], 1);
    console.log(
      totals
        ? `  totals: ${totals.clicks} clicks · ${totals.impressions} impressions · ` +
            `${pct(totals.ctr)} ctr · avg position ${totals.position.toFixed(1)}`
        : "  totals: no data in range",
    );
    console.log("");
    table(await query(site, ["query"], limit), "top queries");
    console.log("");
    table(await query(site, ["page"], limit), "top pages");
  }
  console.log("");
} catch (e) {
  console.error(`gsc-report: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
