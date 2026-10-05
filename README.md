# Coaching progress tracker - demo

Static site, no build step. Four sheet tabs: client check-in (phone form + live sheet log),
My progress (auto stats + charts), Coach dashboard (status-sorted, filterable), How it works.
Brand color switcher re-themes everything. `coaching-tracker-template.xlsx` is a real template:
dropdowns, formulas, charts, and a status dashboard; it opens in Google Sheets via File > Import.

Run locally: `npm start` then open http://localhost:3000
Deploy: `npm run deploy`, or import the folder in Vercel ("Other" preset, no build command).
