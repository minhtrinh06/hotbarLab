---
format: 1920x1080
duration: 35s
message: Plan your hotbar. Practice your keys. Take it into Minecraft.
arc: Demo Loop
audience: Minecraft Java 1.16 speedrunners
mode: autonomous
music: none
---

## Video direction
Real UI, forest canvas, lime accent, cream text. Use frame.md with corrected muted text #989F94 for contrast on dark backgrounds. Smooth sequential reveals and cursor-led screenshot changes. Screenshots sit at x=640,y=180,width=1200,height=750, with their native 1440x900 aspect retained. Header logo and HOTBAR LAB at x=96,y=68. EARLY DEVELOPMENT badge at top right. Left headline column x=96,y=265,width=490. Bottom caption at x=96,y=960, font-size 27; it is an intentional caption band. Three chapter labels at y=880 with current chapter in lime. Never invent app UI, performance claims, metrics or game footage. No narration. Use real screenshot state changes instead of drifting stills. Keep camera fixed and type readable. Screenshot panel and header persist at identical coordinates across cuts.

## Frame 1 — Plan

- scene: Make the next slot feel familiar. Plan a hotbar around your run.
- duration: 11s
- poster: 7s
- transition_in: cut
- status: animated
- src: compositions/frames/scene-plan.html
- blueprint: compose
- asset_candidates: assets/plan.png, assets/plan-slot.png, assets/favicon.svg
- focal: assets/plan.png
- roles: plan.png and plan-slot.png are foreground screenshot states; favicon.svg is the brand mark.

0–2.4s: Top brand, early label, and left headline "Make every slot familiar." arrive with sequential reveal (dynamic-content-sequencing). Actual plan screenshot enters smoothly. Left eyebrow "01 / PLAN".
2.4–5.5s: Caption "Choose a slot. Set its key. Build an item pool." The simulated cursor moves to slot 1 at screenshot-relative x=227,y=695 (cursor-click-ripple), then screenshot changes to plan-slot.png at click time.
5.5–8s: Reveal the left supporting sentence "Shared keys. Scenarios for every stage." Keep screenshot still for reading.
8–11s: Caption updates to "Use flex slots for the items you swap during a run." Chapter strip Plan / Practice / Export highlights Plan. Smooth holds, no exit fade. Header and panel positions fixed.

## Frame 2 — Practice

- scene: Turn your plan into a reflex. Drill the keys you actually use.
- duration: 11s
- poster: 7s
- transition_in: cut
- status: animated
- src: compositions/frames/scene-practice.html
- blueprint: compose
- asset_candidates: assets/practice.png, assets/practice-prompt.png, assets/favicon.svg
- focal: assets/practice.png
- roles: practice.png is setup; practice-prompt.png is a real running prompt; favicon.svg is brand mark.

0–3s: Match shared header/panel geometry exactly. Left eyebrow "02 / PRACTICE" and headline "Turn a plan into a reflex." Reveal caption "Choose your prompts and a 10, 20 or 50-prompt session." Use dynamic-content-sequencing.
3–6s: Simulated cursor moves to Start session in real setup screenshot, click ripple (cursor-click-ripple), then actual running screenshot appears. Do not fabricate countdown or scores. Derive button coordinate from the screenshot.
6–8.5s: Reveal left support "Your items. Your keys. Immediate feedback." Caption "Recognise the item. Press its assigned key."
8.5–11s: Caption "Review accuracy, reaction times and missed bindings." Make no claim about the screenshot having results. Chapter strip highlights Practice. Hold prompt steady to read.

## Frame 3 — Export

- scene: Take your setup into Minecraft. From browser plan to practice files.
- duration: 13s
- poster: 6s
- transition_in: cut
- status: animated
- src: compositions/frames/scene-export.html
- blueprint: compose
- asset_candidates: assets/export.png, assets/export-customize.png, assets/export-download.png, assets/export-settings.png, assets/favicon.svg
- focal: assets/export.png
- roles: Screenshot states are real export UI; favicon.svg is brand mark.

0–3s: Shared header/panel geometry; left eyebrow "03 / EXPORT" and headline "Take it into Minecraft." Caption "Match scenarios to practice loadouts automatically."
3–6s: Cursor click at Customize slot 1 and swap to export-customize.png. Use cursor-click-ripple and dynamic-content-sequencing. Caption "Fine-tune exact items and quantities."
6–9s: Swap panel to export-download.png. Left support reveals "MiniPracticeKit + MCSR Practice Map" with a small "Minecraft Java 1.16.1" line. Caption "Download your practice setup, ready to install."
9–10.5s: Swap to export-settings.png. Caption "Export Markdown and patch standardsettings.json, too."
10.5–13s: Panel reduces opacity to 0.15 while a brand CTA card occupies its centre: "Try Hotbar Lab", "hotbarlab.com", "Very early stage · Feedback welcome". Text 48/36/24 px minimum. This CTA overlays a decorative dimmed screenshot intentionally; annotate only intentional overlap if required. Caption "Plan. Practice. Export. No account required." Chapter strip highlights Export.
