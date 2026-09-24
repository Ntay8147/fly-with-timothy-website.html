# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static HTML page for "Fly With Timothy" — a private aviation broker landing site — deployed on Vercel. There is no build system, no package manager, no framework: the page itself (markup, CSS, SVG graphics, images, and client JS) lives entirely in one file, [index.html](index.html). It's named `index.html` (not a custom name) so static hosts like Vercel/GitHub Pages serve it at the root URL by default. One serverless function, [api/inquiry.js](api/inquiry.js), exists for the contact-form → GHL integration (see below).

## Running / previewing

Open the file directly in a browser — no dev server, install step, or build required:

```bash
start index.html
```

## File structure (all in one file)

- `<style>` (head): all CSS, using custom properties-free plain rules and BEM-ish class names (`.hero`, `.services-grid`, `.card`, `.contact-grid`, etc.). Responsive breakpoints at 900px and 560px near the end of the `<style>` block. `html` has `scroll-behavior: smooth` and `scroll-padding-top: 84px` (offset for the sticky nav bar) for the nav's anchor links; disabled under `prefers-reduced-motion`.
- `<body>`: sections in document order — sticky `.nav`, `.hero` (right side shows the full circular brand badge, dropped in directly with no card wrapper — previously a hand-coded animated SVG jet, replaced per client request), `.services` (4-card grid), `.about` (bio + photos + the same brand badge again), `.contact` (inquiry form + info cards), `.footer`.
- Photos are embedded directly as `data:image/jpeg;base64,...` / `data:image/png;base64,...` URIs inline in `<img src="...">` attributes. These base64 payloads are extremely long single lines (the largest are 50–160k characters) — when reading the file with tools that load it fully, these lines will blow the context budget. Read the file in narrow line-range slices (e.g. `offset`/`limit`, or `sed -n`) and skip over the giant image lines rather than loading the whole file at once.
- `<script>` (end of body): `sendInquiry(e)` POSTs the contact form's fields as JSON to `/api/inquiry` (see below). On success it shows a thank-you message; on any failure it falls back to the old behavior — building a `mailto:` link and redirecting to it, so a lead is never silently lost even if the GHL integration is down.

## GHL integration (api/inquiry.js)

`api/inquiry.js` is a Vercel serverless function (Node runtime, zero dependencies — uses the global `fetch`). On a POST with `{ name, email, phone, details }` it:
1. Upserts a contact in GHL (`POST /contacts/upsert`)
2. Creates an opportunity for that contact in the "Charter Inquiries" pipeline, "New Inquiry" stage (`POST /opportunities/`)
3. If `details` was provided, adds it as a note on the contact (`POST /contacts/{id}/notes`)

It talks to GHL's LeadConnector API (`https://services.leadconnectorhq.com`, `Version: 2021-07-28` header) using a Private Integration token scoped to the Fly With Timothy GHL sub-account (a token from a different sub-account will not work — GHL enforces that the token's own location matches `locationId` in the request).

Required Vercel environment variables (set in the Vercel dashboard, never committed):
- `GHL_API_TOKEN` — Private Integration token, scopes: `contacts.write`, `contacts.readonly`, `opportunities.write`, `opportunities.readonly`
- `GHL_LOCATION_ID` — `AP8AZPUC5Oglv71tvQbU`
- `GHL_PIPELINE_ID` — `pZlf84DQKKUZTBshQTZq` (Charter Inquiries pipeline)
- `GHL_STAGE_ID` — `528f89f2-9c51-494b-9794-77995a0161af` (New Inquiry stage)

If any of these are missing, the function returns a 500 without calling GHL (fails safe into the frontend's mailto fallback).

## Editing notes

- Contact details (email `Timothy@flywithtimothy.com`, phone `+1 (609) 418-0237`, Instagram `@pjrottie`) appear multiple times (nav, contact section, footer, `sendInquiry`) — update all occurrences together.
- The About section bio (Timothy Hood's background) lives in the `.about` block. It ends with the full circular brand badge (base64 PNG with real alpha transparency), placed directly against the page background with no card wrapper. If a future logo revision has dark/brown text meant for a light background, wrap it in a light card (e.g. `background:#f4f0e6;border-radius:16px;padding:18px 22px;`) so the text stays legible — check first with a quick alpha-channel probe (see note below) before assuming a pasted image is actually transparent.
- To replace a photo, swap the `data:image/...;base64,...` payload in the corresponding `<img src>`; don't try to reformat or reflow these lines.
- When embedding a new base64 image, use a script (PowerShell/Node) to splice the base64 string into the file via a placeholder token rather than passing the full string through a text-editing tool — these payloads are 100k+ characters and will blow the context budget otherwise.
- Images pasted directly into the chat get flattened to JPEG in transit, which silently destroys any alpha transparency (backgrounds bake in as solid black/white, not the checkerboard the person may see in their own preview). If a transparent PNG is needed, have the person save the actual file into the project folder and reference the path — never trust a pasted image's format. Verify real transparency before using it: a corner pixel's alpha channel should read 0, not 255 (e.g. via `System.Drawing.Bitmap` in PowerShell: `$img.GetPixel(2,2).A`).
- Color theme is dark/gold: background `#0a0a0a`/`#121212`, accent gold `#cfa94a`/`#e6c877`, text `#f4f0e6`/`#b8b3a6`. Keep new UI consistent with these tokens rather than introducing new colors.
