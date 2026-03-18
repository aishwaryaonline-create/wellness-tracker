# Aish's Wellness Tracker — Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NOTION_TOKEN=secret_xxx...
NOTION_DATABASE_ID=xxx...
ANTHROPIC_API_KEY=sk-ant-...
```

## 3. Set Up Notion Database

Create a Notion database with these **exact** property names:

| Property | Type |
|---|---|
| Date | Date |
| Morning Ritual | Checkbox |
| Kashayam Morning | Checkbox |
| Kashayam Evening | Checkbox |
| Weight Loss Tablet Morning | Checkbox |
| Weight Loss Tablet Evening | Checkbox |
| Spirulina Morning | Checkbox |
| Spirulina Evening | Checkbox |
| Psyllium Husk Morning | Checkbox |
| Psyllium Husk Evening | Checkbox |
| First Meal Time | Rich Text |
| Last Meal Time | Rich Text |
| Meal Log | Rich Text |
| Analysis JSON | Rich Text |

Then:
1. Go to **notion.so/my-integrations** → Create integration → Copy the token
2. Open your database in Notion → **...** menu → **Connect to** → your integration
3. Copy the database ID from the URL: `notion.so/[workspace]/[DATABASE_ID]?v=...`

## 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## App Structure

```
/              → Week View (7-day cards + heatmap)
/day?date=YYYY-MM-DD  → Day View (fasting, habits, meals, AI analysis)
```

## Features

- **Week View**: circular progress rings per day, fasting hours, meal scores, habit heatmap
- **Day View**:
  - Day selector strip to navigate the week
  - Pink gradient score card (habits + fast + meals composite)
  - Intermittent Fasting tracker with auto-calculated fast/eating windows + rating
  - Habit checklist (Morning Ritual + 8 medicine habits) with tap-to-fill pink cards
  - Meal logger with Ayurveda AI analysis (score, dosha balance, Agni, Ama risk, wins/flags, tip)
- **Auto-save** to Notion with 1.2s debounce
- **Framer Motion** animations throughout
- **MOON app-inspired** UI: white cards, hot pink (#E91E8C), coral-pink gradient blobs
