# Sandustry Themes

A collection of editor and terminal color schemes directly sampled and verified from the Sandustry v1 game engine, element registrations, and subterranean terrain geology.

## Included Themes

### 1. Sandustry - Unified (Recommended)

Combines subterranean rock foundations with the glowing chromatic syntax of active factory elements.

- **VS Code Theme**: `Sandustry - Unified`
- **iTerm2 Preset**: `iterm/Sandustry-Unified.itermcolors`
- **Editor Canvas**: `#181c20` (Blackrock)
- **Framing & Activity Bar**: `#141414` (Deep Blackrock)
- **Panels & Side Bar**: `#222222` (Bedrock)
- **Selection & Elevation**: `#2b2b2b` (Obsidian / Scoria)
- **Signature Accent**: `#ffe700` (Game Focus Yellow)

### 2. Sandustry - Elements

A high-energy, vibrant theme built entirely from the game's active liquids, volatile gases, and wisps.

- **VS Code Theme**: `Sandustry - Elements`
- **iTerm2 Preset**: `iterm/Sandustry-Elements.itermcolors`
- **Editor Canvas**: `#1a1410` (Oil)
- **Selection**: `#3b3b3b` (Burnt Residue particle)
- **Cursor & Accent**: `#ffd700` (Gold)

### 3. Sandustry - Terrain (Light Theme)

A subterranean mineral theme designed for light mode editors and terminals.

- **VS Code Theme**: `Sandustry - Terrain Light`
- **iTerm2 Preset**: `iterm/Sandustry-Terrain-Light.itermcolors`
- **Canvas**: `#fffab3` (Crackstone / Sandstone)
- **Framing & Activity Bar**: `#ebe48f` (Sandstone framing)
- **Panels & Side Bar**: `#f7f1a3`
- **Text & Foreground**: `#181c20` (Blackrock)
- **Cursor & Accent**: `#8b5a2b` (Divider)

---

## Color Mapping Reference

| Syntax Construct             | Color     | Source Element / Terrain    |
| :--------------------------- | :-------- | :-------------------------- |
| **Functions & Calls**        | `#1e90ff` | Water (Liquid)              |
| **Types & Classes**          | `#8b82e0` | Aurixite (Mineral wisp)     |
| **Keywords & Control Flow**  | `#cc5cdb` | Petalium / Amethelis (Wisp) |
| **Strings & Characters**     | `#66cc66` | Wet Seed (Slushy)           |
| **Numbers & Constants**      | `#ffd700` | Gold (Solid)                |
| **Properties & Params**      | `#f4a460` | Sand (Solid)                |
| **Operators & Punctuation**  | `#00ced1` | Void Petal (Wisp)           |
| **HTML / JSX Components**    | `#ff66cc` | Prismite (Slushy)           |
| **Regex & String Escapes**   | `#5dcfd6` | Jetpack Fog (Terrain)       |
| **Comments & Docstrings**    | `#808080` | Stone (Terrain)             |
| **Errors & Deletions**       | `#ff3300` | Lava (Liquid)               |
| **Warnings & Modifications** | `#ffa500` | Flame (Gas)                 |
| **Insertions & Git Added**   | `#7fff00` | Seed (Solid)                |

---

## Installation

### VS Code (.vsix package)

Install the packaged `.vsix` file using either method:

1. **Via VS Code GUI**:
   - Open the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
   - Click the `...` menu (top right of the Extensions panel).
   - Select **Install from VSIX...**
   - Choose `sandustry-themes-0.1.0.vsix`.

2. **Via Terminal**:

   ```sh
   code --install-extension sandustry-themes-0.1.0.vsix
   ```

3. **Activate**:
   - Press `Cmd+K Cmd+T` (or `Ctrl+K Ctrl+T`) and select **Sandustry - Unified** or **Sandustry - Elements**.

### iTerm2 (.itermcolors presets)

Double-click or run:

```sh
open iterm/Sandustry-Unified.itermcolors
open iterm/Sandustry-Elements.itermcolors
```

Or in **iTerm2** -> **Settings (⌘,)** -> **Profiles** -> **Colors** -> **Color Presets...** -> **Import...**.

---

## License

MIT © Daryl Roberts
