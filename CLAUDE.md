# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A single self-contained static HTML page for "Fly With Timothy" — a private aviation broker landing site. There is no build system, no package manager, no framework, and no server-side code: everything (markup, CSS, SVG graphics, images, and JS) lives in one file, [fly-with-timothy-website.html](fly-with-timothy-website.html).

## Running / previewing

Open the file directly in a browser — no dev server, install step, or build required:

```bash
start fly-with-timothy-website.html
```

## File structure (all in one file)

- `<style>` (head): all CSS, using custom properties-free plain rules and BEM-ish class names (`.hero`, `.services-grid`, `.card`, `.contact-grid`, etc.). Responsive breakpoints at 900px and 560px near the end of the `<style>` block.
- `<body>`: sections in document order — sticky `.nav`, `.hero` (with an inline hand-coded SVG jet graphic, animated via the `.jet-drift` CSS keyframe), `.services` (4-card grid), `.about` (bio + photos), `.contact` (inquiry form + info cards), `.footer`.
- Photos are embedded directly as `data:image/jpeg;base64,...` / `data:image/png;base64,...` URIs inline in `<img src="...">` attributes. These base64 payloads are extremely long single lines (the largest are 50–160k characters) — when reading the file with tools that load it fully, these lines will blow the context budget. Read the file in narrow line-range slices (e.g. `offset`/`limit`, or `sed -n`) and skip over the giant image lines rather than loading the whole file at once.
- `<script>` (end of body): one function, `sendInquiry(e)`, which builds a `mailto:` link from the contact form fields and redirects to it — there is no backend; form submission just opens the visitor's email client pre-filled with a message addressed to the owner's email.

## Editing notes

- Contact details (email `hargiejalea23@gmail.com`, phone `0995 265 9699`, Instagram `@pjrottie`) appear multiple times (nav, contact section, footer, `sendInquiry`) — update all occurrences together.
- The About section bio currently contains a placeholder: `[YOUR BIO — ...]` (around the `.about` block) — intended to be replaced with real copy.
- To replace a photo, swap the `data:image/...;base64,...` payload in the corresponding `<img src>`; don't try to reformat or reflow these lines.
- Color theme is dark/gold: background `#0a0a0a`/`#121212`, accent gold `#cfa94a`/`#e6c877`, text `#f4f0e6`/`#b8b3a6`. Keep new UI consistent with these tokens rather than introducing new colors.
