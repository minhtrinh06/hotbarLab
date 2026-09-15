# Practice templates

MiniPracticeKit is bundled here; the MCSR Practice Map is hosted in Cloudflare R2.
Hotbar Lab is an independent customization tool using original, unmodified templates.

- `mpk-0.6.nbt`: MiniPracticeKit v0.6 by Knawk.
  Source: https://github.com/Knawk/mc-MiniPracticeKit
  Original download: https://raw.githubusercontent.com/Knawk/mc-MiniPracticeKit/master/hotbar.nbt
- `mcsr-2.0.0.zip`: The MCSR Practice Map v2.0.0 by Dibedy.
  Source: https://github.com/Dibedy/The-MCSR-Practice-Map
  Original release: https://github.com/Dibedy/The-MCSR-Practice-Map/releases/tag/latest
  Upstream credits: Mescht (portal, zero, search crafting, fortress), LlamaPag
  (bastion), and Dibedy (overworld, hub, queue games).

The exact SHA-256 checksums are recorded in `src/data/templates.json` in the app
repository. Generated downloads contain user-specific hotbar changes; the map's
other files and MPK's original command block remain unchanged.

Item IDs, names, and stack limits in `src/data/minecraft-items.json` derive from
PrismarineJS minecraft-data's Java 1.16.1 item registry:
https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/1.16.1/items.json
License: https://github.com/PrismarineJS/minecraft-data/blob/master/LICENSE

Minecraft is a trademark of Mojang/Microsoft. This project is not an official
Minecraft product and is not affiliated with the practice template authors.
