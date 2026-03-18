import { Client } from "@notionhq/client";
import { DayData } from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

const cb = (val: boolean) => ({ checkbox: val });
const rt = (val: string) => ({ rich_text: [{ text: { content: val || "" } }] });
const num = (val: number) => ({ number: val });
const date = (val: string) => ({ date: { start: val } });

function getRichText(props: any, key: string): string {
  return props[key]?.rich_text?.[0]?.text?.content || "";
}
function getCheckbox(props: any, key: string): boolean {
  return props[key]?.checkbox || false;
}

export async function getDayData(d: string): Promise<DayData | null> {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "Date", date: { equals: d } },
  });
  if (res.results.length === 0) return null;

  const page = res.results[0] as any;
  const p = page.properties;

  const analysisRaw = getRichText(p, "Analysis JSON");
  let analysisJson = null;
  try {
    if (analysisRaw) analysisJson = JSON.parse(analysisRaw);
  } catch {}

  return {
    id: page.id,
    date: p["Date"]?.date?.start || d,
    morningRitual: getCheckbox(p, "Morning Ritual"),
    kashayamMorning: getCheckbox(p, "Kashayam Morning"),
    kashayamEvening: getCheckbox(p, "Kashayam Evening"),
    weightLossTabletMorning: getCheckbox(p, "Weight Loss Tablet Morning"),
    weightLossTabletEvening: getCheckbox(p, "Weight Loss Tablet Evening"),
    spirulinaMorning: getCheckbox(p, "Spirulina Morning"),
    spirulinaEvening: getCheckbox(p, "Spirulina Evening"),
    psylliumHuskMorning: getCheckbox(p, "Psyllium Husk Morning"),
    psylliumHuskEvening: getCheckbox(p, "Psyllium Husk Evening"),
    triphalaChurnam: getCheckbox(p, "Triphala Churnam"),
    mealCount: ((p["Meal Count"]?.number ?? 2) as 1 | 2 | 3),
    firstMealTime: getRichText(p, "First Meal Time"),
    lastMealTime: getRichText(p, "Last Meal Time"),
    meal1: getRichText(p, "Meal 1"),
    meal2: getRichText(p, "Meal 2"),
    meal3: getRichText(p, "Meal 3"),
    snacks: getRichText(p, "Snacks"),
    analysisJson,
    wellnessScore: p["Wellness Score"]?.number ?? null,
  };
}

export async function upsertDayData(data: DayData): Promise<DayData> {
  const existing = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "Date", date: { equals: data.date } },
  });

  const properties: Record<string, any> = {
    Date: date(data.date),
    "Morning Ritual": cb(data.morningRitual),
    "Kashayam Morning": cb(data.kashayamMorning),
    "Kashayam Evening": cb(data.kashayamEvening),
    "Weight Loss Tablet Morning": cb(data.weightLossTabletMorning),
    "Weight Loss Tablet Evening": cb(data.weightLossTabletEvening),
    "Spirulina Morning": cb(data.spirulinaMorning),
    "Spirulina Evening": cb(data.spirulinaEvening),
    "Psyllium Husk Morning": cb(data.psylliumHuskMorning),
    "Psyllium Husk Evening": cb(data.psylliumHuskEvening),
    "Triphala Churnam": cb(data.triphalaChurnam),
    "Meal Count": num(data.mealCount ?? 2),
    "First Meal Time": rt(data.firstMealTime),
    "Last Meal Time": rt(data.lastMealTime),
    "Meal 1": rt(data.meal1),
    "Meal 2": rt(data.meal2),
    "Meal 3": rt(data.meal3),
    "Snacks": rt(data.snacks),
    "Analysis JSON": rt(data.analysisJson ? JSON.stringify(data.analysisJson) : ""),
    "Wellness Score": num(data.wellnessScore ?? 0),
  };

  if (existing.results.length > 0) {
    const page = await notion.pages.update({
      page_id: existing.results[0].id,
      properties,
    });
    return { ...data, id: page.id };
  } else {
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties,
    });
    return { ...data, id: page.id };
  }
}

export async function getWeekData(startDate: string, endDate: string): Promise<DayData[]> {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        { property: "Date", date: { on_or_after: startDate } },
        { property: "Date", date: { on_or_before: endDate } },
      ],
    },
    sorts: [{ property: "Date", direction: "ascending" }],
  });

  return res.results.map((page: any) => {
    const p = page.properties;
    const analysisRaw = getRichText(p, "Analysis JSON");
    let analysisJson = null;
    try {
      if (analysisRaw) analysisJson = JSON.parse(analysisRaw);
    } catch {}
    return {
      id: page.id,
      date: p["Date"]?.date?.start || "",
      morningRitual: getCheckbox(p, "Morning Ritual"),
      kashayamMorning: getCheckbox(p, "Kashayam Morning"),
      kashayamEvening: getCheckbox(p, "Kashayam Evening"),
      weightLossTabletMorning: getCheckbox(p, "Weight Loss Tablet Morning"),
      weightLossTabletEvening: getCheckbox(p, "Weight Loss Tablet Evening"),
      spirulinaMorning: getCheckbox(p, "Spirulina Morning"),
      spirulinaEvening: getCheckbox(p, "Spirulina Evening"),
      psylliumHuskMorning: getCheckbox(p, "Psyllium Husk Morning"),
      psylliumHuskEvening: getCheckbox(p, "Psyllium Husk Evening"),
      triphalaChurnam: getCheckbox(p, "Triphala Churnam"),
      mealCount: ((p["Meal Count"]?.number ?? 2) as 1 | 2 | 3),
      firstMealTime: getRichText(p, "First Meal Time"),
      lastMealTime: getRichText(p, "Last Meal Time"),
      meal1: getRichText(p, "Meal 1"),
      meal2: getRichText(p, "Meal 2"),
      meal3: getRichText(p, "Meal 3"),
      snacks: getRichText(p, "Snacks"),
      analysisJson,
      wellnessScore: p["Wellness Score"]?.number ?? null,
    } as DayData;
  });
}
