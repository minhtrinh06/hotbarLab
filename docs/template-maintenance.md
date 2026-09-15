# Template hosting and maintenance

The map is downloaded from `https://assets.hotbarlab.com/mcsr-2.0.0.zip` in the
`hotbarlab` R2 bucket. MiniPracticeKit remains a bundled asset. The custom bucket
domain must be active, and the bucket's **Settings → CORS Policy** must allow browser
downloads (merge this rule with any existing policy):

```json
[{ "AllowedOrigins": ["*"], "AllowedMethods": ["GET", "HEAD"] }]
```

## Template maintenance

MiniPracticeKit is pinned in `public/templates`. Keep the MCSR ZIP in the ignored
`.cache/templates/mcsr-2.0.0.zip` for map export tests and metadata regeneration;
never put it in `public`, where Vite would copy it into the Pages build.
On a fresh checkout, download the test/maintenance copy once before running tests:

```bash
mkdir -p .cache/templates
curl --fail --location --output .cache/templates/mcsr-2.0.0.zip https://assets.hotbarlab.com/mcsr-2.0.0.zip
```

Source links, versions, checksums, and explicit destination paths are recorded in
`src/data/templates.json`. To deliberately update a template, inspect its native
inventory loading/saving behavior, replace the asset, and regenerate metadata:

```bash
node scripts/prepare-templates.mjs /path/to/minecraft-data/data/pc/1.16.1/items.json
```

The optional item file refreshes the checked-in item registry and stack limits.
Never replace template assets without regenerating and testing the destination map.
The template author credits and item-data source are in
[`public/templates/ATTRIBUTION.md`](../public/templates/ATTRIBUTION.md).

## Checks

```bash
npm test
npm run build
npm run e2e
```

Tests decode both generated formats, verify every destination and selected-loadout
copy, check unrelated map files and NBT, and exercise downloads in a browser.
Before distributing a new template version, also smoke-test the six MPK barrels and
each supported map loadout system in Minecraft 1.16.1, including in-game save/reload.

See [`public/assets/ATTRIBUTION.md`](../public/assets/ATTRIBUTION.md) for sprite sources.

[Back to the README](../README.md)
