# Hotbar Lab

A local-first Minecraft 1.16 speedrunning hotbar planner, reaction trainer, and practice exporter.

## Run

```bash
npm install
npm run dev
```

The plan is autosaved in browser storage. Uploaded `standardsettings.json` files never leave the browser.

## Saved layouts and practice downloads

Create or duplicate named layouts, rename them in the header, and select a default.
Keybinds are shared; each layout stores its own item preferences. Existing v1 plans
are migrated automatically, keeping the original storage entry as a backup.

The Export tab includes two built-in templates for **Java 1.16.1**:

- **MiniPracticeKit 0.6:** customize all six preset barrels and download `hotbar.nbt`.
  Close Minecraft, back up your existing file, and put the download in the instance's
  `.minecraft` folder. Load creative saved hotbar 1 (default: X + 1).
- **MCSR Practice Map 2.0.0:** customize 24 native loadouts across portal, fortress,
  zero/one-cycle, and bastion practice. Extract the ZIP into `saves`; `level.dat`
  must sit directly inside `Hotbar Lab - MCSR Practice`. Select your loadout in-game
  as usual. Other practice sections keep their original behavior.

Assign a saved layout to any destination, or leave it on the default. Items are
matched in preference order, with earlier hotbar slots winning collisions. Built-in
tool, bed, boat, block, food, and bucket preferences also match their common variants;
custom item mappings match exact IDs. Unmatched stacks keep their original position
when free, then use remaining slots. Nothing is added to an empty preset automatically.
Reset eggs are retained in their original slots.
Fortress randomized shulker loadouts match their possible items while keeping their
original random choices and quantities.

The nine-slot preview lets you replace an item, change its quantity, explicitly
empty a slot, or restore automatic placement. Overrides belong to the destination,
so switching its assigned layout keeps those overrides. Replacing an item is an
intentional replacement of that stack; it does not move the displaced stack into
the rest of the inventory. Existing special NBT is retained when moving an item
or changing its quantity. A newly selected item uses its vanilla default data.
Text-only custom planner labels do not affect game exports until mapped to an item.

The map's remaining inventory, offhand, armor, and original reset defaults are kept.
MPK uses unique temporary item tags and placeholders to prevent pickup from merging
stacks or collapsing gaps; a supported AUTO book restores the exact hotbar after
pickup. The original MPK command block and triggers are retained.

Template downloads happen only when requested (the map is about 93 MB). Export runs
in a browser worker with SHA-256 verification, progress, cancellation, and retry.
Changing a layout cancels an export already in progress, preventing stale downloads.
No layout data is uploaded and no backend is needed.

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
[`public/templates/ATTRIBUTION.md`](public/templates/ATTRIBUTION.md).

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

See [`public/assets/ATTRIBUTION.md`](public/assets/ATTRIBUTION.md) for sprite sources.
