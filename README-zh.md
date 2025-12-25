# Multi-Column Layout | [English](./README.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.5.0+-purple.svg)](https://obsidian.md)

✅ **杂志级排版样式 | 无需记忆语法 | 实时预览支持**  
✅ **多栏布局 | 快速插入模板 | 自定义宽度比例**  
✅ **Obsidian v1.5.0+ | Windows / macOS / Linux**

Multi-Column Layout 是一款 Obsidian 插件，旨在通过简单的 Callout 语法实现优雅的并排内容排版。通过右键菜单，您可以瞬间插入预设的多栏布局。

## ✨ 功能特性

| 功能 | 描述 |
| :--- | :--- |
| **🚀 快速插入** | 右键菜单一键插入 50/50, 30/70 或 33/34/33 布局。 |
| **🎨 自定义宽度** | 使用元数据（如 `[!col|40]`）轻松调整每一栏的宽度比例。 |
| **📺 实时预览** | 支持 Live Preview，在输入时即可看到排版效果。 |
| **🔗 兼容性强** | 基于标准 Markdown/Callout 语法，即使不安装插件内容依然可读。 |

## 🚀 使用指南

1. 在编辑器中 **点击右键**。
2. 选择 **Insert Multi-Column**。
3. 选择您需要的布局模板。
4. 在生成的代码块中开始编写内容！

---

<details>
<summary><b>🛠️ 要求与技术细节</b></summary>

- 需要 Obsidian v1.5.0 或更高版本。
- 使用 CSS Flexbox 进行渲染。
- 语法结构：使用 `> [!multi-column]` 作为容器，`>> [!col]` 作为子栏。
</details>

<details>
<summary><b>💻 开发者指南</b></summary>

1. 克隆此仓库。
2. 运行 `npm install`（如果已添加 package.json）。
3. 将 `main.js`, `manifest.json`, 和 `styles.css` 复制到你库的插件文件夹中。
</details>

## 🤝 贡献与联系

欢迎提交 Issue 和 Pull Request！  
如有任何问题或建议，请联系 Zheyuan (Max) Kong (卡内基梅隆大学，宾夕法尼亚州)。

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
