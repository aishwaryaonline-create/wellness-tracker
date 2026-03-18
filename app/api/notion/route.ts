import { NextRequest, NextResponse } from "next/server";
import { getDayData, upsertDayData, patchDayData, getWeekData } from "@/lib/notion";

/** Extracts the most useful error detail from a Notion API error or generic Error. */
function notionError(label: string, err: any): NextResponse {
  const status = err?.status ?? err?.code === "unauthorized" ? 401 : 500;
  const message: string =
    err?.body?.message ||        // Notion API error body
    err?.message ||               // generic Error
    String(err);
  const detail = {
    label,
    message,
    notionCode: err?.code,        // e.g. "object_not_found", "unauthorized"
    notionStatus: err?.status,
    notionBody: err?.body,        // full Notion error payload
    envCheck: {
      hasToken: !!process.env.NOTION_TOKEN,
      hasDatabaseId: !!process.env.NOTION_DATABASE_ID,
      databaseId: process.env.NOTION_DATABASE_ID?.slice(0, 8) + "…", // partial for safety
    },
  };
  console.error(`[notion] ${label}:`, JSON.stringify(detail, null, 2));
  return NextResponse.json({ error: message, detail }, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    if (start && end) {
      const data = await getWeekData(start, end);
      return NextResponse.json({ data });
    }
    if (date) {
      const data = await getDayData(date);
      return NextResponse.json({ data });
    }
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  } catch (err: any) {
    return notionError("GET", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await upsertDayData(body);
    return NextResponse.json({ data: saved });
  } catch (err: any) {
    return notionError("POST", err);
  }
}

/** Partial update — only touches the fields included in the request body. */
export async function PATCH(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { date, ...fields } = body;
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  try {
    const saved = await patchDayData(date, fields);
    return NextResponse.json({ data: saved });
  } catch (err: any) {
    return notionError(`PATCH date=${date}`, err);
  }
}
