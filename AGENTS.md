# Project context

## Deployment (confirmed by the user on 2026-09-15)

- Hotbar Lab is deployed on Cloudflare Pages.
- The MCSR Practice Map is served from Cloudflare R2, at https://assets.hotbarlab.com/mcsr-2.0.0.zip in the `hotbarlab` bucket.
- MiniPracticeKit remains bundled with the app.
- Keep the large MCSR ZIP out of `public` and the Pages build. A local copy for tests and maintenance belongs in `.cache/templates/mcsr-2.0.0.zip`.
- See README.md for R2 CORS configuration and template maintenance details.
