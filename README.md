# Multi-Column Layout | [中文版](./README-zh.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.5.0+-purple.svg)](https://obsidian.md)

✅ **Magazine-style Layout | No Syntax to Memorize | Live Preview Support**  
✅ **Multi-Column Layout | Quick Insert Templates | Custom Width Ratios**  
✅ **Obsidian v1.5.0+ | Windows / macOS / Linux**  

Multi-Column Layout is an Obsidian plugin that simplifies the creation of side-by-side content using the built-in Callout syntax. It provides a convenient context menu to insert layouts instantly.

<p align="center">
  <img src="Presentation/image_v1.5.0.png" alt="Multi-Column Layout Demo" width="800">
  <br>
  <a href="Presentation/demo.md">Click to view how to generate the style above using this plugin's syntax</a>
</p>

<p align="center">
  <img src="Presentation/resizer.gif" alt="Column Resizer Demo" width="800">
</p>

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **🚀 Quick Insert** | Right-click menu for 2-col, 3-col, Sidebar, and **Nested** layouts. |
| **🎨 Visual Styling** | Customize background colors, borders, and corner radius in settings. |
| **🧱 Separate Column Cards** | Optional setting to render bordered columns as independent cards instead of one continuous panel. |
| **🧩 Nested Layouts** | Create complex grids by nesting columns inside columns. |
| **📐 Custom Widths** | Adjust column widths easily using metadata like `[!col|40]`. |
| **🖱️ Drag Resize** | Drag dividers in Live Preview to resize columns and write ratios back to `[!col|..]`. |
| **📺 Live Preview** | See your layouts rendered instantly as you type. |
| **✍️ In-Column Editing** | In Live Preview, Markdown-style empty-line exit is enabled by default; you can disable it in Settings to keep strict in-column auto-prefix behavior (`>>/>>>>`). |
| **🔗 Compatibility** | Uses standard Markdown/Callout syntax for maximum portability. |

## 📥 Installation

### Method 1: Using BRAT Plugin (Recommended)
This is the easiest way to install and keep the plugin updated before the official release.
1. Install **BRAT** from the Community Plugins in Obsidian.
2. Open BRAT settings and click **Add Beta plugin**.
3. Enter the repository URL: `https://github.com/MaxMiksa/Obsidian-MultiColumn-Layout`
4. Click **Add Plugin**.

### Method 2: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [Releases](../../releases) page.
2. Create a folder named `multi-column-layout` inside `.obsidian/plugins/` in your vault.
3. Place the downloaded files into that folder.
4. Reload Obsidian and enable the plugin.

### Method 3: Community Plugins
The plugin has been submitted for review and is expected to be available around **late January 2026**. Once approved, you can search for "Multi-Column Layout" directly in the community store.

## 🚀 Usage Guide

<img src="Presentation/smart-paste.png" align="right" width="360" alt="Smart Paste Demo">

1. **Right-click** anywhere in your editor.
2. Navigate to **Insert Multi-Column**.
3. Select your desired layout (e.g., 2 Columns, Nested Columns).
4. Start typing your content inside the generated blocks!

## 📝 Syntax Guide

The syntax is designed to be simple and intuitive if you prefer typing it manually:

- **Container**: Use `> [!multi-column]` to create the wrapper.
- **Column**: Use `>> [!col]` nested inside to create columns.
- **Widths**: Add a pipe and number to define width percentage, e.g., `>> [!col|30]`.
- **Nested Columns**: Inside a `>> [!col]`, use deeper `>>> [!multi-column]` blocks to create sub-columns.

**Basic Example:**

```markdown
> [!multi-column]
>
>> [!col|30]
>> Left sidebar content...
>
>> [!col|70]
>> Main content area...
```

**Nested Example:**

```markdown
> [!multi-column]
>
>> [!col]
>> Left Column
>
>> [!col]
>> Right Column
>>
>>> [!multi-column]
>>>
>>>> [!col]
>>>> Nested Column A
>>>
>>>> [!col]
>>>> Nested Column B
```

---

<details>
<summary><b>🛠️ Requirements & Technical Details</b></summary>

- Requires Obsidian v1.5.0 or higher.
- Uses CSS Flexbox for rendering.
- Syntax: `> [!multi-column]` as container, `>> [!col]` as columns.
- Nested Layouts use deeper nesting: `>>> [!multi-column]` inside `>> [!col]`.
</details>

<details>
<summary><b>💻 Developer Guide</b></summary>

1. Clone this repo.
2. Run `npm install`.
3. Run `npm run dev` (watch) or `npm run build`.
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder.
</details>

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!  
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
