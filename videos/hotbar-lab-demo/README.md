# Hotbar Lab demo

A **35-second, 1920 × 1080, silent** product demo made with HyperFrames. The three scenes use screenshots captured from the real app: Plan (0–11s), Practice (11–22s), and Export (22–35s). Captions are part of the picture, so the video works without sound or a subtitle player.

- [Finished MP4](../../docs/media/hotbar-lab-demo.mp4)
- [Inline GIF preview](../../docs/media/demo-preview.gif)
- [Contact sheet](../../docs/media/demo-contact-sheet.jpg)
- [Brief](BRIEF.md) and [storyboard](STORYBOARD.md)

## Preview and render

Requires Node.js 22.12+ and the browser/runtime dependencies used by HyperFrames. FFmpeg must be available for rendering. Commands below run from this directory; the scripts pin HyperFrames **0.8.40**.

```bash
npm run check
npm run dev
npm run render -- --quality delivery --fps 30 --output ../../docs/media/hotbar-lab-demo.mp4
```

Open the Studio URL printed by the preview command. There is no HeyGen sign-in requirement for this silent local composition. Fonts and screenshots are local assets.

To regenerate the compact README animation from the MP4 with FFmpeg:

```bash
ffmpeg -y -ss 1.4 -i ../../docs/media/hotbar-lab-demo.mp4 -filter_complex "fps=8,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 ../../docs/media/demo-preview.gif
```

## Refresh the screenshots

Start the app at port 4173 from the repository root:

```bash
npm ci
npx playwright install chromium
npm run dev -- --port 4173
```

In another terminal, also at the repository root:

```bash
node scripts/capture-demo.mjs
```

This uses a fresh Playwright browser context, captures the three views and supporting UI states, and verifies a real `hotbar.nbt` download. It writes screenshots to `docs/media/` and this project's `assets/`. It does not modify your personal browser storage. On Linux, install Chromium's system dependencies if needed (
px playwright install --with-deps chromium`).

The movie stages screenshot states and an animated cursor; it is not a continuous screen recording. After refreshing, check cursor coordinates and scene timing against the new interface, then rerun the composition check and inspect the rendered output.

## Files and credits

- `index.html` assembles the three scenes in `compositions/frames/`.
- `assets/` contains actual application captures, the app icon, locally bundled Inter fonts, and GSAP.
- `frame.md` records the design direction; `STORYBOARD.md` records captions and timing.
- Cursor primitive: [HyperFrames](https://github.com/heygen-com/hyperframes).
- GSAP: [GreenSock](https://gsap.com/standard-license/).
- Inter: [Rasmus Andersson](https://github.com/rsms/inter), SIL Open Font License; see [assets/Inter-OFL.txt](assets/Inter-OFL.txt).
- App imagery: [repository asset attribution](../../public/assets/ATTRIBUTION.md).

Build caches, capture diagnostics, and temporary render files are ignored. The MP4, GIF, screenshots, and editable source are intended to be checked in as documentation assets; they are outside Vite's `public/` directory.
