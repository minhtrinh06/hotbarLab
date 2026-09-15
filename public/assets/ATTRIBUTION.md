# Asset attribution

The Minecraft 1.16.1 textures under `items/` are unmodified game textures by Mojang Studios, retrieved from the [minecraft-assets archive](https://github.com/InventivetalentDev/minecraft-assets) through [mcasset.cloud](https://mcasset.cloud/1.16.1). Minecraft is a trademark of Microsoft Corporation. This fan-made utility is not affiliated with or endorsed by Mojang or Microsoft.

The rendered red bed reference image was retrieved from [PNGAll](https://www.pngall.com/minecraft-bed-png/) and is used only as an item cue in this local fan utility.

`custom.svg` is an original fallback icon created for Hotbar Lab.

## Practice icons

- `practice/leather-boots.png`: Minecraft leather boots inventory render from [MC Item Gallery](https://mcitemgallery.com/items/leather-boots/), version 1.14.4.
- `practice/grass-block.png`: Minecraft grass block inventory render from [MC Item Gallery](https://mcitemgallery.com/items/grass-block/), version 1.15.2.
- `practice/ninjabrain.jpg`: profile image from [Ninjabrain's YouTube channel](https://www.youtube.com/c/Ninjabrain), retrieved September 15, 2026; used as the requested overlay cue.
- `practice/wide-macro.png` and `practice/thin-macro.png`: user-supplied Minecraft screenshots. The thin screenshot is also used for Eye Measure Macro.
- `practice/offhand.png`: user-supplied pixel shield, edited with the built-in imagegen tool to remove its gray background. Prompt: “Remove the gray background including the gray interior, leaving only the exact dark pixel-art shield outline on genuine transparency. Preserve the original stepped square pixel silhouette, color, proportions and centered composition exactly. No new details, shading or smoothing.” The UI tints the outline for contrast.
- `practice/arrow-left.svg`, `practice/arrow-right.svg`, and `practice/reset.svg`: original UI icons created for Hotbar Lab.

# Asset attribution

The Minecraft item art is by Mojang Studios. Minecraft is a trademark of Microsoft Corporation. This fan-made utility is not affiliated with or endorsed by Mojang or Microsoft.

The inventory renders and composite cues listed in `src/data/sheet-items.json`, including the bed, blocks, respawn anchor and glowstone, were extracted unchanged from [roobley's hotbar sheet](https://docs.google.com/spreadsheets/d/1Efwtnfo6B0ZdNx8iLFy73GQZ8ez1HjefB2fg9lLzReQ/edit) on September 15, 2026. The sheet credits the Minecraft Wiki for most icons. `water-bucket.png` retains the original Minecraft 1.16.1 texture from [mcasset.cloud](https://mcasset.cloud/1.16.1).

## Scenarios and player templates

`src/data/sheet-templates.json` transcribes scenario labels, hotbar columns B–J, offhand column L, and recorded keybinds from the same sheet. Basics uses all 12 rows from `basic template`. Advanced uses the 27 rows unique to `100% template`. Blank template rows are intentionally empty. Player templates use the named player tabs, including `silverrruns` for silverruns and `infume old` for Infume. Infume's template is a legacy snapshot; Lowkey and Infume have no recorded keys. Composite icons remain single cues, preserving the source alternatives without enabling flex pools. Inventory positions outside the hotbar and offhand are not imported.

Player head faces in `players/` were retrieved from [MCHeads](https://mc-heads.net/) on September 15, 2026 using account UUIDs verified against the [MCSR Ranked API](https://api.mcsrranked.com/). Accounts: hackingnoises (`7c92678742eb4e819f3122017697ae3d`), doogile (`3c8757790ab0400b8b9e3936e0dd535b`), Infume (`a54e3bc4c6354b07a236b81efbcfe791`), silverrruns (`17e787d1d6374f818b294f2319db370d`), lowk3y_ (`7665f76f431b41c6b321bea16aff913b`, linked Twitch account: lowkey), edcr (`635f35ee69ed4f0c94ff26ece4818956`). All assets are served locally.

`custom.svg` is an original fallback icon created for Hotbar Lab.
