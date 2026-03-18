import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

/**
 * GET /api/notion/debug
 *
 * Checks:
 *  1. Env vars are set
 *  2. Notion token can authenticate
 *  3. Database ID resolves to a real database
 *  4. Lists every property the database actually has
 *  5. Diffs against the property names the code expects
 *
 * Safe to hit from a browser tab on the live deployment.
 */

const EXPECTED_PROPERTIES = [
  "Column Name",
  "Date",
  "Morning Ritual",
  "Kashayam Morning",
  "Kashayam Evening",
  "Wellness Tablet Morning",
  "Wellness Tablet Evening",
  "Green Supplement Morning",
  "Green Supplement Evening",
  "Psyllium Husk Morning",
  "Psyllium Husk Evening",
  "Triphala Churnam",
  "Meal Count",
  "First Meal Time",
  "Last Meal Time",
  "Meal 1",
  "Meal 2",
  "Meal 3",
  "Snacks",
  "Analysis JSON",
  "Wellness Score",
];

export async function GET() {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  const envCheck = {
    NOTION_TOKEN: token ? `set (${token.slice(0, 8)}…)` : "MISSING",
    NOTION_DATABASE_ID: dbId ? `set (${dbId.slice(0, 8)}…)` : "MISSING",
  };

  if (!token || !dbId) {
    return NextResponse.json({ ok: false, envCheck, error: "Missing env vars" }, { status: 500 });
  }

  const notion = new Client({ auth: token });

  let dbProperties: Record<string, string> = {};
  let fetchError: string | null = null;

  try {
    const db = await notion.databases.retrieve({ database_id: dbId });
    dbProperties = Object.fromEntries(
      Object.entries((db as any).properties).map(([name, prop]: [string, any]) => [name, prop.type])
    );
  } catch (err: any) {
    fetchError =
      err?.body?.message || err?.message || String(err);
  }

  const actualNames = Object.keys(dbProperties);
  const missing = EXPECTED_PROPERTIES.filter((p) => !actualNames.includes(p));
  const unexpected = actualNames.filter((p) => !EXPECTED_PROPERTIES.includes(p));

  return NextResponse.json({
    ok: fetchError === null && missing.length === 0,
    envCheck,
    fetchError,
    databaseProperties: dbProperties,
    schemaDiff: {
      missing,     // expected by code but NOT in Notion
      unexpected,  // in Notion but not used by code (fine, just informational)
    },
  });
}
