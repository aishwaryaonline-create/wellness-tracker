import { NextRequest, NextResponse } from "next/server";
import { getDayData, upsertDayData, patchDayData, getWeekData } from "@/lib/notion";

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
    console.error("Notion GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await upsertDayData(body);
    return NextResponse.json({ data: saved });
  } catch (err: any) {
    console.error("Notion POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Partial update — only touches the fields included in the request body. */
export async function PATCH(req: NextRequest) {
  try {
    const { date, ...fields } = await req.json();
    if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
    const saved = await patchDayData(date, fields);
    return NextResponse.json({ data: saved });
  } catch (err: any) {
    console.error("Notion PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
