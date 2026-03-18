import { Client } from "@notionhq/client";
import { DayData } from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

const cb = (val: boolean) => ({ checkbox: val });
const rt = (val: string) => {
  const content = (val || "").slice(0, 1990);
  return { rich_text: [{ text: { content } }] };
};
const num = (val: number) => ({ number: val });
const dateprop = (val: string) => ({ date: { start: val } });

function getRichText(props: any, key: string): string {
  return props[key]?.rich_text?.[0]?.text?.content || "";
}
function getCheckbox(props: any, key: string): boolean {
  return props[key]?.checkbox || false;
}
function parseMealCount(val: any): 1 | 2 | 3 {
  return val === 1 || val === 2 || val === 3 ? val : 2;
}

function mapPage(page: any, fallbackDate: string): DayData {
  const p = page.properties;
  const analysisRaw = getRichText(p, "Analysis JSON");
  let analysisJson = null;
  try {
    if (analysisRaw) analysisJson = JSON.parse(analysisRaw);
  } catch {}

  return {
    id: page.id,
    date: p["Date"]?.date?.start || fallbackDate,
    morningRitual: getCheckbox(p, "Morning Ritual"),
    kashayamMorning: getCheckbox(p, "Kashayam Morning"),
    kashayamEvening: getCheckbox(p, "Kashayam Evening"),
    wellnessTabletMorning: getCheckbox(p, "Wellness Tablet Morning"),
    wellnessTabletEvening: getCheckbox(p, "Wellness Tablet Evening"),
    greenSupplementMorning: getCheckbox(p, "Green Supplement Morning"),
    greenSupplementEvening: getCheckbox(p, "Green Supplement Evening"),
    psylliumHuskMorning: getCheckbox(p, "Psyllium Husk Morning"),
    psylliumHuskEvening: getCheckbox(p, "Psyllium Husk Evening"),
    triphalaChurnam: getCheckbox(p, "Triphala Churnam"),
    mealCount: parseMealCount(p["Meal Count"]?.number),
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

/** Build a Notion properties object from only the fields present in the patch. */
function buildProperties(fields: Partial<DayData>): Record<string, any> {
  const props: Record<string, any> = {};

  if (fields.date !== undefined) {
    props["Column Name"] = { title: [{ text: { content: fields.date } }] };
    props["Date"] = dateprop(fields.date);
  }
  if (fields.morningRitual !== undefined) props["Morning Ritual"] = cb(fields.morningRitual);
  if (fields.kashayamMorning !== undefined) props["Kashayam Morning"] = cb(fields.kashayamMorning);
  if (fields.kashayamEvening !== undefined) props["Kashayam Evening"] = cb(fields.kashayamEvening);
  if (fields.wellnessTabletMorning !== undefined) props["Wellness Tablet Morning"] = cb(fields.wellnessTabletMorning);
  if (fields.wellnessTabletEvening !== undefined) props["Wellness Tablet Evening"] = cb(fields.wellnessTabletEvening);
  if (fields.greenSupplementMorning !== undefined) props["Green Supplement Morning"] = cb(fields.greenSupplementMorning);
  if (fields.greenSupplementEvening !== undefined) props["Green Supplement Evening"] = cb(fields.greenSupplementEvening);
  if (fields.psylliumHuskMorning !== undefined) props["Psyllium Husk Morning"] = cb(fields.psylliumHuskMorning);
  if (fields.psylliumHuskEvening !== undefined) props["Psyllium Husk Evening"] = cb(fields.psylliumHuskEvening);
  if (fields.triphalaChurnam !== undefined) props["Triphala Churnam"] = cb(fields.triphalaChurnam);
  if (fields.mealCount !== undefined) props["Meal Count"] = num(parseMealCount(fields.mealCount));
  if (fields.firstMealTime !== undefined) props["First Meal Time"] = rt(fields.firstMealTime);
  if (fields.lastMealTime !== undefined) props["Last Meal Time"] = rt(fields.lastMealTime);
  if (fields.meal1 !== undefined) props["Meal 1"] = rt(fields.meal1);
  if (fields.meal2 !== undefined) props["Meal 2"] = rt(fields.meal2);
  if (fields.meal3 !== undefined) props["Meal 3"] = rt(fields.meal3);
  if (fields.snacks !== undefined) props["Snacks"] = rt(fields.snacks);
  if ("analysisJson" in fields) {
    const analysisStr = fields.analysisJson
      ? JSON.stringify(fields.analysisJson).slice(0, 1990)
      : "";
    props["Analysis JSON"] = rt(analysisStr);
  }
  if (fields.wellnessScore !== undefined) props["Wellness Score"] = num(fields.wellnessScore ?? 0);

  return props;
}

export async function getDayData(d: string): Promise<DayData | null> {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "Date", date: { equals: d } },
  });
  if (res.results.length === 0) return null;
  return mapPage(res.results[0], d);
}

/** Full upsert — creates or replaces the entire day record. */
export async function upsertDayData(data: DayData): Promise<DayData> {
  const existing = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "Date", date: { equals: data.date } },
  });

  const properties = buildProperties(data);

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

/**
 * Partial update — only touches the fields you pass.
 * Other fields in Notion are left completely unchanged.
 */
export async function patchDayData(
  date: string,
  fields: Partial<DayData>
): Promise<DayData> {
  const existing = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: "Date", date: { equals: date } },
  });

  const properties = buildProperties(fields);

  if (existing.results.length > 0) {
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties,
    });
  } else {
    // First time saving this day — create the row with date + patched fields
    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        "Column Name": { title: [{ text: { content: date } }] },
        Date: dateprop(date),
        ...properties,
      },
    });
  }

  const updated = await getDayData(date);
  return updated!;
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
  return res.results.map((page) => mapPage(page, ""));
}
