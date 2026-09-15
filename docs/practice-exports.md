# Practice export guide

Create or duplicate named scenarios, rename them in the header, and select a default.
Keybinds are shared; each scenario stores its own item preferences. Existing v1 plans
are migrated automatically, keeping the original storage entry as a backup.

The Export tab includes two built-in templates for **Java 1.16.1**:

- **MiniPracticeKit 0.6:** customize all six preset barrels and download `hotbar.nbt`.
  Close Minecraft, back up your existing file, and put the download in the instance's
  `.minecraft` folder. Load creative saved hotbar 1 (default: X + 1).
- **MCSR Practice Map 2.0.0:** customize 24 native loadouts across portal, fortress,
  zero/one-cycle, and bastion practice. Extract the ZIP into `saves`; `level.dat`
  must sit directly inside `Hotbar Lab - MCSR Practice`. Select your loadout in-game
  as usual. Other practice sections keep their original behavior.

Practice destinations automatically use their matching saved scenario:

| MiniPracticeKit barrel | Scenario |
| --- | --- |
| Nether Enter / Bastion Enter | Nether terrain |
| Fortress Enter | Into fort |
| Nether Exit | Blinding |
| Eye Spy | Stronghold |
| End Enter | Zero |

MCSR uses Blinding for Nether Exit, Stronghold for Stronghold, and Portal break for
Portal Break. Fortress Bed, TNT, and combined presets use Blaze bed, Blaze TNT,
and Blaze bed & TNT respectively; Fortress Loadout 5 uses Into fort. Cycle presets
use Zero, and bastion presets use Nether terrain. Other portal drills use your
default scenario. Missing or deleted matching scenarios also fall back to your default.

Choose **Automatic** to use this mapping, or assign any saved scenario manually.
Manual assignments and exact overrides are retained. Renaming a scenario keeps its
automatic mapping. Items are
matched in preference order, with earlier hotbar slots winning collisions. Built-in
tool, bed, boat, block, food, and bucket preferences also match their common variants;
custom item mappings match exact IDs. Unmatched stacks keep their original position
when free, then use remaining slots. Nothing is added to an empty preset automatically.
Reset eggs are retained in their original slots.
Fortress randomized shulker loadouts match their possible items while keeping their
original random choices and quantities.

The nine-slot preview lets you replace an item, change its quantity, explicitly
empty a slot, or restore automatic placement. Overrides belong to the destination,
so switching its assigned scenario keeps those overrides. Replacing an item is an
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
Changing a scenario cancels an export already in progress, preventing stale downloads.
No scenario data is uploaded and no backend is needed.


[Back to the README](../README.md)
