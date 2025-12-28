// src/editor/extensions.ts
var { EditorSelection, Prec, Transaction } = require("@codemirror/state");
var { EditorView, keymap } = require("@codemirror/view");
function insertNewlineWithColumnPrefix(view, ctx) {
  const range = view.state.selection.main;
  const insertText = `
${ctx.prefixWithSpace}`;
  const anchor = range.from + insertText.length;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: insertText },
    selection: EditorSelection.cursor(anchor),
    annotations: Transaction.userEvent.of("input.enter")
  });
  return true;
}
function findEnclosingMultiColumnContainer(view, fromLine, expectedDepth) {
  const minLine = Math.max(1, fromLine - 400);
  for (let lineNumber = fromLine; lineNumber >= minLine; lineNumber--) {
    const text = view.state.doc.line(lineNumber).text;
    const m = /^(\s*)(>+)\s*\[!multi-column([^\]]*)\]/.exec(text);
    if (!m) continue;
    if (m[2].length !== expectedDepth) continue;
    return true;
  }
  return false;
}
function getColumnContext(view) {
  const pos = view.state.selection.main.head;
  const doc = view.state.doc;
  const currentLine = doc.lineAt(pos);
  const minLine = Math.max(1, currentLine.number - 200);
  for (let lineNumber = currentLine.number; lineNumber >= minLine; lineNumber--) {
    const text = doc.line(lineNumber).text;
    const m = /^(\s*)(>+)\s*\[!col([^\]]*)\]/.exec(text);
    if (!m) continue;
    const colDepth = m[2].length;
    if (colDepth !== 2 && colDepth !== 4) continue;
    const containerDepth = colDepth - 1;
    const hasContainer = findEnclosingMultiColumnContainer(view, lineNumber - 1, containerDepth);
    if (!hasContainer) continue;
    const prefixBare = `${m[1]}${m[2]}`;
    return { prefixBare, prefixWithSpace: `${prefixBare} `, colDepth };
  }
  return null;
}
function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}
function buildPrefixedPasteText(ctx, clipboardText, opts) {
  const normalized = normalizeNewlines(clipboardText);
  if (!normalized.includes("\n")) return null;
  const parts = normalized.split("\n");
  if (parts.length <= 1) return null;
  const [first, ...rest] = parts;
  const firstWithPrefix = (() => {
    if (!opts.prefixFirstLine) return first;
    if (first.length === 0) return ctx.prefixBare;
    return `${ctx.prefixWithSpace}${first}`;
  })();
  const suffix = rest.map((line) => {
    if (line.length === 0) return `
${ctx.prefixBare}`;
    return `
${ctx.prefixWithSpace}${line}`;
  }).join("");
  return `${firstWithPrefix}${suffix}`;
}
function buildMultiColumnEditorExtensions(_plugin) {
  return [
    Prec.high(
      keymap.of([
        {
          key: "Enter",
          run(view) {
            const ctx = getColumnContext(view);
            if (!ctx) return false;
            return insertNewlineWithColumnPrefix(view, ctx);
          }
        }
      ])
    ),
    EditorView.domEventHandlers({
      paste(event, view) {
        var _a;
        const ctx = getColumnContext(view);
        if (!ctx) return;
        const clipboardText = (_a = event.clipboardData) == null ? void 0 : _a.getData("text/plain");
        if (!clipboardText) return;
        const range = view.state.selection.main;
        const line = view.state.doc.lineAt(range.from);
        const prefixEndInLine = line.text.startsWith(ctx.prefixWithSpace) ? ctx.prefixWithSpace.length : ctx.prefixBare.length;
        const prefixEndPos = line.from + prefixEndInLine;
        const prefixFirstLine = range.from < prefixEndPos;
        const insertText = buildPrefixedPasteText(ctx, clipboardText, { prefixFirstLine });
        if (!insertText) return;
        event.preventDefault();
        const anchor = range.from + insertText.length;
        view.dispatch({
          changes: { from: range.from, to: range.to, insert: insertText },
          selection: EditorSelection.cursor(anchor),
          annotations: Transaction.userEvent.of("input.paste")
        });
      }
    })
  ];
}

// src/main.ts
var { Plugin, Menu, MarkdownView, PluginSettingTab, Setting, Modal, Notice } = require("obsidian");
var DEFAULT_SETTINGS = {
  language: "en",
  dividerWidth: "1px",
  dividerStyle: "solid",
  dividerColor: "gray",
  horzDivider: false,
  horzDividerWidth: "1px",
  horzDividerStyle: "solid",
  horzDividerColor: "gray",
  backgroundColor: "none",
  borderEnabled: false,
  borderWidth: "1px",
  borderRadius: "0"
};
var PRESET_COLORS = {
  "none": "transparent",
  "gray": "#cfd3d7",
  "red": "#f4a5a5",
  "orange": "#f7c48f",
  "yellow": "#f5f1a6",
  "green": "#8fddb0",
  "cyan": "#95eded",
  "blue": "#9cbcf2",
  "purple": "#c8acef",
  "black": "#4a4a4a",
  "white": "#ffffff"
};
var TEXTS = {
  en: {
    "settings.title": "Multi-Column Layout Settings",
    "settings.general": "General",
    "settings.language": "Language",
    "settings.language.desc": "Choose the display language for the plugin.",
    "settings.background": "Background Color",
    "settings.background.desc": "Background color for the multi-column container.",
    "settings.border": "Container Border",
    "settings.border.enable": "Show Border",
    "settings.border.enable.desc": "Draw a border around the multi-column container. Border color follows background (slightly darker).",
    "settings.border.width": "Border Width",
    "settings.border.radius": "Corner Radius",
    "colors.none": "Transparent",
    "colors.gray": "Gray",
    "colors.red": "Red",
    "colors.orange": "Orange",
    "colors.yellow": "Yellow",
    "colors.green": "Green",
    "colors.cyan": "Cyan",
    "colors.blue": "Blue",
    "colors.purple": "Purple",
    "colors.black": "Black",
    "colors.white": "White",
    "settings.vertical": "Vertical Dividers (Bordered)",
    "settings.horizontal": "Horizontal Dividers",
    "settings.width": "Width",
    "settings.width.desc": "Width of the line (e.g., 1px, 2px).",
    "settings.style": "Style",
    "settings.style.desc": "Style of the line.",
    "style.solid": "Solid",
    "style.dashed": "Dashed",
    "style.dotted": "Dotted",
    "style.double": "Double",
    "settings.color": "Color",
    "settings.color.desc": "Color of the line.",
    "settings.horz.enable": "Enable Horizontal Dividers",
    "settings.horz.enable.desc": "Automatically add top and bottom borders to NEW inserted layouts.",
    "settings.migrate": "Apply current appearance to all existing layouts",
    "settings.migrate.desc": "Migrates every multi-column callout in your vault to use the current bordered/horizontal flags. This updates old notes for a consistent look.",
    "settings.migrate.running": "Applying appearance to existing layouts...",
    "settings.migrate.done": "Updated {0} file(s).",
    "settings.migrate.error": "Failed to apply appearance. See console for details.",
    "menu.2col": "2 Columns",
    "menu.3col": "3 Columns",
    "menu.nested": "Nested Columns",
    "menu.nested.2col": "Parent + Nested 2 Columns",
    "menu.nested.3col": "Parent + Nested 3 Columns",
    "menu.nested.here.2col": "Insert Nested 2 Columns Here",
    "menu.nested.here.3col": "Insert Nested 3 Columns Here",
    "menu.custom": "Custom Layout...",
    "notice.nested.notInCol": "Place the cursor inside a column to insert nested columns.",
    "notice.nested.limit": "Nested columns are limited to 1 level.",
    "modal.title": "Custom Column Ratios",
    "modal.instruction": "Enter ratios separated by slashes (e.g. 30/70 or 20/30/50). Sum must be 100.",
    "modal.insert": "Insert Layout",
    "modal.error.format": "Invalid format. Use numbers separated by /.",
    "modal.error.sum": "Sum is {0}%, but must be 100%."
  },
  zh: {
    "settings.title": "\u591A\u5217\u5E03\u5C40\u8BBE\u7F6E",
    "settings.general": "\u5E38\u89C4",
    "settings.language": "\u8BED\u8A00",
    "settings.language.desc": "\u9009\u62E9\u63D2\u4EF6\u663E\u793A\u7684\u8BED\u8A00\u3002",
    "settings.background": "\u80CC\u666F\u989C\u8272",
    "settings.background.desc": "\u591A\u5217\u5E03\u5C40\u5BB9\u5668\u7684\u80CC\u666F\u989C\u8272\u3002",
    "settings.border": "\u8FB9\u6846",
    "settings.border.enable": "\u663E\u793A\u8FB9\u6846",
    "settings.border.enable.desc": "\u4E3A\u591A\u5217\u5BB9\u5668\u7ED8\u5236\u8FB9\u6846\uFF0C\u989C\u8272\u4E0E\u80CC\u666F\u4E00\u81F4\u4F46\u7565\u6DF1\u3002",
    "settings.border.width": "\u8FB9\u6846\u5BBD\u5EA6",
    "settings.border.radius": "\u5706\u89D2\u534A\u5F84",
    "colors.none": "\u900F\u660E",
    "colors.gray": "\u7070\u8272",
    "colors.red": "\u7EA2\u8272",
    "colors.orange": "\u6A59\u8272",
    "colors.yellow": "\u9EC4\u8272",
    "colors.green": "\u7EFF\u8272",
    "colors.cyan": "\u9752\u8272",
    "colors.blue": "\u84DD\u8272",
    "colors.purple": "\u7D2B\u8272",
    "colors.black": "\u6DF1\u7070",
    "colors.white": "\u767D\u8272",
    "settings.vertical": "\u5782\u76F4\u5206\u5272\u7EBF",
    "settings.horizontal": "\u6C34\u5E73\u5206\u5272\u7EBF",
    "settings.width": "\u5BBD\u5EA6",
    "settings.width.desc": "\u7EBF\u6761\u5BBD\u5EA6\uFF08\u4F8B\u5982 1px, 2px\uFF09\u3002",
    "settings.style": "\u6837\u5F0F",
    "settings.style.desc": "\u7EBF\u6761\u6837\u5F0F\u3002",
    "style.solid": "\u5B9E\u7EBF",
    "style.dashed": "\u865A\u7EBF",
    "style.dotted": "\u70B9\u7EBF",
    "style.double": "\u53CC\u7EBF",
    "settings.color": "\u989C\u8272",
    "settings.color.desc": "\u7EBF\u6761\u989C\u8272\u3002",
    "settings.horz.enable": "\u542F\u7528\u6C34\u5E73\u5206\u5272\u7EBF",
    "settings.horz.enable.desc": "\u5728\u65B0\u63D2\u5165\u7684\u5E03\u5C40\u4E0A\u81EA\u52A8\u6DFB\u52A0\u4E0A\u4E0B\u8FB9\u6846\u3002",
    "settings.migrate": "\u5C06\u5F53\u524D\u5916\u89C2\u5E94\u7528\u4E8E\u6240\u6709\u5DF2\u5199\u5E03\u5C40",
    "settings.migrate.desc": "\u628A\u5F53\u524D\u7684\u5206\u5272\u7EBF\u98CE\u683C\u540C\u6B65\u5230\u5E93\u91CC\u5DF2\u6709\u7684 multi-column callout\uFF0C\u786E\u4FDD\u7EDF\u4E00\u663E\u793A\u3002",
    "settings.migrate.running": "\u6B63\u5728\u5E94\u7528\u5230\u5DF2\u6709\u5E03\u5C40\u2026",
    "settings.migrate.done": "\u5DF2\u66F4\u65B0 {0} \u4E2A\u6587\u4EF6\u3002",
    "settings.migrate.error": "\u5E94\u7528\u5916\u89C2\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u65E5\u5FD7\u3002",
    "menu.2col": "2 \u5217",
    "menu.3col": "3 \u5217",
    "menu.nested": "\u5B50\u5206\u680F\uFF08\u5206\u680F\u4E2D\u5D4C\u5957\u5206\u680F\uFF09",
    "menu.nested.2col": "\u7236\u5217 + \u5B50\u5206\u680F 2 \u5217",
    "menu.nested.3col": "\u7236\u5217 + \u5B50\u5206\u680F 3 \u5217",
    "menu.nested.here.2col": "\u5728\u6B64\u5904\u63D2\u5165\u5B50\u5206\u680F 2 \u5217",
    "menu.nested.here.3col": "\u5728\u6B64\u5904\u63D2\u5165\u5B50\u5206\u680F 3 \u5217",
    "menu.custom": "\u81EA\u5B9A\u4E49\u5206\u680F...",
    "notice.nested.notInCol": "\u8BF7\u628A\u5149\u6807\u653E\u5728\u67D0\u4E00\u5217\u7684\u5185\u5BB9\u4E2D\uFF0C\u518D\u63D2\u5165\u5B50\u5206\u680F\u3002",
    "notice.nested.limit": "\u5B50\u5206\u680F\u4EC5\u652F\u6301 1 \u5C42\u5D4C\u5957\u3002",
    "modal.title": "\u81EA\u5B9A\u4E49\u5217\u6BD4\u4F8B",
    "modal.instruction": "\u7528\u659C\u6760\u5206\u9694\u6BD4\u4F8B\uFF08\u4F8B\u5982 30/70 \u6216 20/30/50\uFF09\uFF0C\u603B\u548C\u5FC5\u987B\u662F 100\u3002",
    "modal.insert": "\u63D2\u5165\u5E03\u5C40",
    "modal.error.format": "\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u7528\u6570\u5B57\u52A0\u659C\u6760\u3002",
    "modal.error.sum": "\u5F53\u524D\u603B\u548C\u4E3A {0}% \uFF0C\u5FC5\u987B\u662F 100%\u3002"
  }
};
var MultiColumnLayoutPlugin = class extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MultiColumnLayoutSettingTab(this.app, this));
    this.applySettingsStyles();
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        this.addInsertMenu(menu, editor);
      })
    );
    this.registerMarkdownPostProcessor((el, ctx) => {
      this.applyColumnWidths(el);
      this.attachColumnResizers(el, ctx);
    });
    this.registerEditorExtension(buildMultiColumnEditorExtensions(this));
  }
  t(key, ...args) {
    const lang = this.settings.language || "en";
    let str = TEXTS[lang][key] || TEXTS["en"][key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
    return str;
  }
  colorLabel(key) {
    return this.t(`colors.${key}`) || key;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.applySettingsStyles();
  }
  applySettingsStyles() {
    const style = document.body.style;
    const vColor = PRESET_COLORS[this.settings.dividerColor] || this.settings.dividerColor;
    const hColor = PRESET_COLORS[this.settings.horzDividerColor] || this.settings.horzDividerColor;
    const baseColor = PRESET_COLORS[this.settings.backgroundColor] || this.settings.backgroundColor;
    const hexMatch = typeof baseColor === "string" && baseColor.startsWith("#") && baseColor.length === 7;
    const toRGBA = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    let bgColor = baseColor;
    let borderColor = baseColor;
    if (hexMatch) {
      bgColor = toRGBA(baseColor, 0.13);
      borderColor = toRGBA(baseColor, 0.26);
    } else {
      bgColor = baseColor || "transparent";
      borderColor = baseColor || "transparent";
    }
    const borderWidth = this.settings.borderEnabled ? this.settings.borderWidth : "0";
    const borderRadius = this.settings.borderRadius || "0";
    style.setProperty("--mcl-divider-width", this.settings.dividerWidth);
    style.setProperty("--mcl-divider-style", this.settings.dividerStyle);
    style.setProperty("--mcl-divider-color", vColor);
    style.setProperty("--mcl-horz-divider-width", this.settings.horzDividerWidth);
    style.setProperty("--mcl-horz-divider-style", this.settings.horzDividerStyle);
    style.setProperty("--mcl-horz-divider-color", hColor);
    style.setProperty("--mcl-background-color", bgColor);
    style.setProperty("--mcl-border-color", borderColor || "transparent");
    style.setProperty("--mcl-border-width", borderWidth);
    style.setProperty("--mcl-border-radius", borderRadius);
  }
  addInsertMenu(menu, editor) {
    menu.addItem((item) => {
      item.setTitle(this.t("menu.2col"));
      item.setIcon("columns");
      item.onClick(() => this.safeInsert(editor, 2, [50, 50], "bordered"));
    });
    menu.addItem((item) => {
      item.setTitle(this.t("menu.3col"));
      item.setIcon("columns");
      item.onClick(() => this.safeInsert(editor, 3, [33, 34, 33], "bordered"));
    });
    menu.addItem((item) => {
      item.setTitle(this.t("menu.nested"));
      item.setIcon("layout");
      const subMenu = item.setSubmenu();
      subMenu.addItem((subItem) => {
        subItem.setTitle(this.t("menu.nested.2col"));
        subItem.setIcon("columns");
        subItem.onClick(() => this.safeInsertNested(editor, 2));
      });
      subMenu.addItem((subItem) => {
        subItem.setTitle(this.t("menu.nested.3col"));
        subItem.setIcon("columns");
        subItem.onClick(() => this.safeInsertNested(editor, 3));
      });
      subMenu.addSeparator();
      subMenu.addItem((subItem) => {
        subItem.setTitle(this.t("menu.nested.here.2col"));
        subItem.setIcon("columns");
        subItem.onClick(() => this.safeInsertNestedHere(editor, 2));
      });
      subMenu.addItem((subItem) => {
        subItem.setTitle(this.t("menu.nested.here.3col"));
        subItem.setIcon("columns");
        subItem.onClick(() => this.safeInsertNestedHere(editor, 3));
      });
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(this.t("menu.custom"));
      item.setIcon("settings-sliders");
      item.onClick(() => {
        const activeEditor = this.getActiveEditor() || editor;
        if (activeEditor) {
          new CustomRatioModal(this.app, this, (cols, ratios) => {
            this.insertColumnLayout(activeEditor, cols, ratios, "bordered");
          }).open();
        }
      });
    });
  }
  safeInsert(passedEditor, cols, ratios, meta) {
    const activeEditor = this.getActiveEditor() || passedEditor;
    if (!activeEditor) {
      console.error("Multi-Column Plugin: No active editor found.");
      return;
    }
    this.insertColumnLayout(activeEditor, cols, ratios, meta);
  }
  safeInsertNested(passedEditor, innerCols) {
    const activeEditor = this.getActiveEditor() || passedEditor;
    if (!activeEditor) {
      console.error("Multi-Column Plugin: No active editor found.");
      return;
    }
    this.insertNestedLayout(activeEditor, innerCols);
  }
  safeInsertNestedHere(passedEditor, innerCols) {
    const activeEditor = this.getActiveEditor() || passedEditor;
    if (!activeEditor) {
      console.error("Multi-Column Plugin: No active editor found.");
      return;
    }
    this.insertNestedHere(activeEditor, innerCols);
  }
  getActiveEditor() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view ? view.editor : null;
  }
  insertColumnLayout(editor, columnCount, ratios, metadata = "") {
    if (!editor) return;
    editor.focus();
    const metaParts = [];
    if (metadata) metaParts.push(metadata);
    if (this.settings.horzDivider) metaParts.push("horizontal");
    const metaStr = metaParts.length > 0 ? `|${metaParts.join("|")}` : "";
    const lines = [];
    lines.push(`> [!multi-column${metaStr}]`);
    lines.push(">");
    for (let i = 0; i < columnCount; i++) {
      const ratio = Array.isArray(ratios) ? ratios[i] : void 0;
      const colMeta = typeof ratio === "number" && !isNaN(ratio) ? `|${ratio}` : "";
      lines.push(`>> [!col${colMeta}]`);
      lines.push(">>");
      if (i < columnCount - 1) {
        lines.push(">");
      }
    }
    const block = lines.join("\n") + "\n";
    try {
      const cursor = editor.getCursor();
      editor.replaceSelection(block);
      const target = { line: cursor.line + 3, ch: 3 };
      editor.setCursor(target);
      editor.focus();
    } catch (err) {
      console.error("Multi-Column Plugin: Failed to insert text", err);
    }
  }
  insertNestedLayout(editor, innerCols) {
    if (!editor) return;
    editor.focus();
    const outerMetaParts = ["bordered"];
    if (this.settings.horzDivider) outerMetaParts.push("horizontal");
    const outerMetaStr = outerMetaParts.length ? `|${outerMetaParts.join("|")}` : "";
    const innerMetaParts = ["bordered"];
    if (this.settings.horzDivider) innerMetaParts.push("horizontal");
    const innerMetaStr = innerMetaParts.length ? `|${innerMetaParts.join("|")}` : "";
    const outerRatios = [40, 60];
    const innerRatios = this.buildDefaultRatios(innerCols);
    const lines = [];
    lines.push(`> [!multi-column${outerMetaStr}]`);
    lines.push(">");
    lines.push(`>> [!col|${outerRatios[0]}]`);
    lines.push(">> ## Parent Column");
    lines.push(">> - Add your content here.");
    lines.push(">");
    lines.push(`>> [!col|${outerRatios[1]}]`);
    lines.push(">> ## Nested Columns");
    lines.push(">>");
    lines.push(`>>> [!multi-column${innerMetaStr}]`);
    lines.push(">>>");
    for (let i = 0; i < innerCols; i++) {
      const ratio = innerRatios[i];
      const colMeta = typeof ratio === "number" ? `|${ratio}` : "";
      lines.push(`>>>> [!col${colMeta}]`);
      lines.push(">>>> ");
      if (i < innerCols - 1) {
        lines.push(">>>");
      }
    }
    const block = lines.join("\n") + "\n";
    try {
      const cursor = editor.getCursor();
      editor.replaceSelection(block);
      const target = { line: cursor.line + 7, ch: 4 };
      editor.setCursor(target);
      editor.focus();
    } catch (err) {
      console.error("Multi-Column Plugin: Failed to insert nested layout", err);
    }
  }
  buildDefaultRatios(count) {
    if (!count || count < 1) return [];
    const base = Math.floor(100 / count);
    const ratios = new Array(count).fill(base);
    const remainder = 100 - base * count;
    if (remainder !== 0) {
      ratios[ratios.length - 1] += remainder;
    }
    return ratios;
  }
  applyColumnWidths(el) {
    const columns = el.querySelectorAll('div.callout[data-callout="col"][data-callout-metadata]');
    columns.forEach((col) => {
      const raw = col.getAttribute("data-callout-metadata");
      const width = parseInt(raw, 10);
      if (Number.isFinite(width) && width > 0 && width <= 100) {
        col.style.flex = `0 0 ${width}%`;
        col.style.minWidth = "0";
      }
    });
  }
  attachColumnResizers(rootEl, ctx) {
    const containers = rootEl.querySelectorAll('div.callout[data-callout="multi-column"]');
    containers.forEach((container) => {
      var _a, _b, _c, _d, _e;
      const content = container.querySelector(":scope > .callout-content") || container.querySelector(".callout-content");
      if (!content) return;
      if (content.classList.contains("mcl-resizing")) return;
      content.querySelectorAll(":scope > .mcl-resizer").forEach((el) => el.remove());
      const cols = Array.from(content.children).filter(
        (child) => child instanceof HTMLElement && child.matches('div.callout[data-callout="col"]')
      );
      if (cols.length < 2) return;
      const section = (_d = (_c = (_a = ctx == null ? void 0 : ctx.getSectionInfo) == null ? void 0 : _a.call(ctx, container)) != null ? _c : (_b = ctx == null ? void 0 : ctx.getSectionInfo) == null ? void 0 : _b.call(ctx, rootEl)) != null ? _d : null;
      const sourcePath = (_e = ctx == null ? void 0 : ctx.sourcePath) != null ? _e : null;
      if (sourcePath) {
        container.dataset.mclSourcePath = sourcePath;
      }
      if (section) {
        container.dataset.mclLineStart = String(section.lineStart);
        container.dataset.mclLineEnd = String(section.lineEnd);
      } else {
        delete container.dataset.mclLineStart;
        delete container.dataset.mclLineEnd;
      }
      const handleWidth = 12;
      const positionHandles = () => {
        var _a2;
        const topInset = ((_a2 = getComputedStyle(container).getPropertyValue("--mcl-divider-inset")) == null ? void 0 : _a2.trim()) || "1rem";
        for (let i = 0; i < cols.length - 1; i++) {
          const handle = content.querySelector(`:scope > .mcl-resizer[data-index="${i}"]`);
          if (!handle) continue;
          const x = cols[i].offsetLeft + cols[i].offsetWidth;
          handle.style.left = `${x - handleWidth / 2}px`;
          handle.style.top = topInset;
          handle.style.bottom = topInset;
          handle.style.width = `${handleWidth}px`;
        }
      };
      for (let i = 0; i < cols.length - 1; i++) {
        const handle = document.createElement("div");
        handle.className = "mcl-resizer";
        handle.dataset.index = String(i);
        handle.setAttribute("aria-label", "Resize columns");
        content.insertBefore(handle, cols[i + 1]);
        const onMouseDown = (ev) => {
          var _a2;
          if (ev.button !== 0) return;
          ev.preventDefault();
          ev.stopPropagation();
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          const editor = (_a2 = view == null ? void 0 : view.editor) != null ? _a2 : null;
          if (!editor || !(view == null ? void 0 : view.file) || sourcePath && view.file.path !== sourcePath) {
            new Notice("Please use Live Preview (editable) to resize columns.");
            return;
          }
          const containerRect = content.getBoundingClientRect();
          const totalWidth = Math.max(1, content.clientWidth);
          const startX = ev.clientX;
          const widths = cols.map((colEl) => colEl.getBoundingClientRect().width);
          const ratios = widths.map((w) => Math.max(1, Math.round(w / totalWidth * 100)));
          const sum = ratios.reduce((a, b) => a + b, 0);
          if (sum !== 100 && sum > 0) {
            const normalized = ratios.map((r) => Math.max(1, Math.round(r / sum * 100)));
            const diff = 100 - normalized.reduce((a, b) => a + b, 0);
            normalized[normalized.length - 1] += diff;
            for (let k = 0; k < normalized.length; k++) ratios[k] = normalized[k];
          }
          const idx = i;
          const pairTotal = ratios[idx] + ratios[idx + 1];
          const minPx = 60;
          const minPct = Math.max(1, Math.ceil(minPx / totalWidth * 100));
          const beforePct = ratios.slice(0, idx).reduce((a, b) => a + b, 0);
          content.classList.add("mcl-resizing");
          document.body.classList.add("mcl-global-resizing");
          const applyRatiosToDOM = () => {
            for (let k = 0; k < cols.length; k++) {
              cols[k].style.flex = `0 0 ${ratios[k]}%`;
              cols[k].style.minWidth = "0";
              cols[k].setAttribute("data-callout-metadata", String(ratios[k]));
            }
            positionHandles();
          };
          const onMove = (moveEv) => {
            moveEv.preventDefault();
            const mouseX = moveEv.clientX;
            const rel = Math.min(Math.max(mouseX - containerRect.left, 0), totalWidth);
            const targetPct = Math.round(rel / totalWidth * 100);
            let newLeft = targetPct - beforePct;
            newLeft = Math.min(Math.max(newLeft, minPct), pairTotal - minPct);
            ratios[idx] = newLeft;
            ratios[idx + 1] = pairTotal - newLeft;
            applyRatiosToDOM();
          };
          const onUp = (upEv) => {
            upEv.preventDefault();
            window.removeEventListener("mousemove", onMove, true);
            window.removeEventListener("mouseup", onUp, true);
            content.classList.remove("mcl-resizing");
            document.body.classList.remove("mcl-global-resizing");
            if (Math.abs(upEv.clientX - startX) < 1) {
              applyRatiosToDOM();
              return;
            }
            const prevSelections = editor.listSelections();
            const prevScroll = editor.getScrollInfo();
            this.writeBackColumnRatios(container, ratios, { editor, prevSelections, prevScroll });
          };
          window.addEventListener("mousemove", onMove, true);
          window.addEventListener("mouseup", onUp, true);
          applyRatiosToDOM();
        };
        handle.addEventListener("mousedown", onMouseDown);
      }
      requestAnimationFrame(positionHandles);
    });
  }
  writeBackColumnRatios(containerEl, ratios, ctx) {
    var _a, _b, _c, _d;
    const sourcePath = containerEl.dataset.mclSourcePath;
    const lineStart = parseInt(containerEl.dataset.mclLineStart || "", 10);
    const lineEnd = parseInt(containerEl.dataset.mclLineEnd || "", 10);
    if (!sourcePath || !Number.isFinite(lineStart) || !Number.isFinite(lineEnd)) {
      new Notice("Resize applied visually, but failed to locate source lines for write-back.");
      return;
    }
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (_b = (_a = ctx == null ? void 0 : ctx.editor) != null ? _a : view == null ? void 0 : view.editor) != null ? _b : null;
    if (!(view == null ? void 0 : view.file) || view.file.path !== sourcePath || !editor) {
      new Notice("Resize applied visually, but write-back requires the note to be open in Live Preview.");
      return;
    }
    const findMultiColumnHeader = () => {
      for (let line = lineStart; line <= lineEnd; line++) {
        const text = editor.getLine(line);
        const m = /^(\s*)(>+)\s*\[!multi-column([^\]]*)\]/.exec(text);
        if (m) return { line, depth: m[2].length };
      }
      return null;
    };
    const header = findMultiColumnHeader();
    if (!header) {
      new Notice("Resize write-back failed: multi-column header not found.");
      return;
    }
    const colDepth = header.depth + 1;
    const colHeaderRe = new RegExp(`^(\\s*)(>{${colDepth}})\\s*\\[!col([^\\]]*)\\]`);
    const colLines = [];
    for (let line = header.line; line <= lineEnd; line++) {
      const text = editor.getLine(line);
      if (colHeaderRe.test(text)) colLines.push({ line, text });
      if (colLines.length >= ratios.length) break;
    }
    if (colLines.length !== ratios.length) {
      new Notice(`Resize write-back failed: expected ${ratios.length} columns, found ${colLines.length}.`);
      return;
    }
    const rewriteColHeader = (lineText, ratio) => {
      return lineText.replace(/\[!col([^\]]*)\]/, (_m, meta) => {
        const raw = String(meta || "");
        const parts = raw.startsWith("|") ? raw.slice(1).split("|").filter((p) => p.length > 0) : [];
        if (parts.length > 0 && /^\d+$/.test(parts[0])) {
          parts[0] = String(ratio);
        } else {
          parts.unshift(String(ratio));
        }
        return `[!col|${parts.join("|")}]`;
      });
    };
    const changes = colLines.map(({ line, text }, idx) => {
      const updated = rewriteColHeader(text, ratios[idx]);
      if (updated === text) return null;
      return {
        from: { line, ch: 0 },
        to: { line, ch: text.length },
        text: updated
      };
    }).filter(Boolean).sort((a, b) => b.from.line - a.from.line);
    if (changes.length === 0) return;
    const prevSelections = (_c = ctx == null ? void 0 : ctx.prevSelections) != null ? _c : editor.listSelections();
    const prevScroll = (_d = ctx == null ? void 0 : ctx.prevScroll) != null ? _d : editor.getScrollInfo();
    editor.transaction({ changes }, "mcl-resize");
    requestAnimationFrame(() => {
      try {
        editor.setSelections(prevSelections, 0);
        editor.scrollTo(prevScroll.left, prevScroll.top);
        editor.focus();
      } catch (e) {
      }
    });
  }
  /**
   * Apply current appearance flags (bordered/horizontal) to all existing multi-column callouts in the vault.
   */
  async applyAppearanceToAllFiles() {
    const files = this.app.vault.getMarkdownFiles();
    let updated = 0;
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const migrated = this.migrateContent(content);
      if (migrated !== content) {
        await this.app.vault.modify(file, migrated);
        updated++;
      }
    }
    return updated;
  }
  migrateContent(content) {
    const hasHorizontal = !!this.settings.horzDivider;
    return content.replace(/^(\s*>\s*\[!multi-column)([^\]]*)(\])/gm, (_m, prefix, metaStr, suffix) => {
      const metaRaw = metaStr || "";
      const parts = metaRaw.startsWith("|") ? metaRaw.slice(1).split("|").filter(Boolean) : [];
      if (!parts.includes("bordered")) parts.push("bordered");
      const filtered = parts.filter((p) => p !== "horizontal");
      if (hasHorizontal) filtered.push("horizontal");
      const rebuilt = filtered.length > 0 ? `|${filtered.join("|")}` : "";
      return `${prefix}${rebuilt}${suffix}`;
    });
  }
  getColDepthAtCursor(editor) {
    const cursor = editor.getCursor();
    const minLine = Math.max(0, cursor.line - 5e3);
    for (let line = cursor.line; line >= minLine; line--) {
      const text = editor.getLine(line);
      const m = /^(\s*)(>+)\s*\[!col([^\]]*)\]/.exec(text);
      if (!m) continue;
      const depth = m[2].length;
      if (depth !== 2 && depth !== 4) continue;
      return depth;
    }
    const currentText = editor.getLine(cursor.line) || "";
    const prefixMatch = /^(\s*)(>+)\s+/.exec(currentText);
    if (prefixMatch) {
      const depth = prefixMatch[2].length;
      if (depth >= 4) return 4;
      if (depth >= 2) return 2;
    }
    return null;
  }
  insertNestedHere(editor, innerCols) {
    if (!editor) return;
    editor.focus();
    const colDepth = this.getColDepthAtCursor(editor);
    if (!colDepth) {
      new Notice(this.t("notice.nested.notInCol"));
      return;
    }
    if (colDepth !== 2) {
      new Notice(this.t("notice.nested.limit"));
      return;
    }
    const metaParts = ["bordered"];
    if (this.settings.horzDivider) metaParts.push("horizontal");
    const metaStr = metaParts.length ? `|${metaParts.join("|")}` : "";
    const containerPrefix = ">".repeat(colDepth + 1);
    const colPrefix = ">".repeat(colDepth + 2);
    const ratios = this.buildDefaultRatios(innerCols);
    const lines = [];
    lines.push(`${containerPrefix} [!multi-column${metaStr}]`);
    lines.push(containerPrefix);
    for (let i = 0; i < innerCols; i++) {
      const ratio = ratios[i];
      lines.push(`${colPrefix} [!col|${ratio}]`);
      lines.push(`${colPrefix} `);
      if (i < innerCols - 1) {
        lines.push(containerPrefix);
      }
    }
    const block = lines.join("\n") + "\n";
    try {
      const cursor = editor.getCursor();
      const lineCount = editor.lineCount();
      const nextLineText = cursor.line + 1 < lineCount ? editor.getLine(cursor.line + 1) || "" : "";
      const emptyColLineRe = new RegExp("^\\s*" + ">".repeat(colDepth) + "\\s*$");
      const insertAfterLine = emptyColLineRe.test(nextLineText) ? cursor.line + 1 : cursor.line;
      let blockStartLine;
      if (insertAfterLine + 1 >= lineCount) {
        const lastLine = lineCount - 1;
        const lastCh = (editor.getLine(lastLine) || "").length;
        editor.replaceRange(`
${block}`, { line: lastLine, ch: lastCh });
        blockStartLine = lastLine + 1;
      } else {
        editor.replaceRange(block, { line: insertAfterLine + 1, ch: 0 });
        blockStartLine = insertAfterLine + 1;
      }
      editor.setCursor({ line: blockStartLine + 3, ch: colPrefix.length + 1 });
      editor.focus();
    } catch (err) {
      console.error("Multi-Column Plugin: Failed to insert nested layout", err);
    }
  }
};
var CustomRatioModal = class extends Modal {
  constructor(app, plugin, onSubmit) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.plugin.t("modal.title") });
    const instruction = contentEl.createEl("p", { text: this.plugin.t("modal.instruction") });
    instruction.style.color = "var(--text-muted)";
    instruction.style.marginBottom = "1rem";
    const inputContainer = contentEl.createDiv();
    const input = inputContainer.createEl("input", { type: "text", placeholder: "50/50" });
    input.style.width = "100%";
    input.focus();
    const errorMsg = contentEl.createEl("p", { text: "" });
    errorMsg.style.color = "var(--text-error)";
    errorMsg.style.marginTop = "0.5rem";
    errorMsg.style.display = "none";
    const btnContainer = contentEl.createDiv();
    btnContainer.style.marginTop = "1rem";
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "flex-end";
    const submitBtn = btnContainer.createEl("button", { text: this.plugin.t("modal.insert") });
    submitBtn.addClass("mod-cta");
    const validateAndSubmit = () => {
      const val = input.value.trim();
      if (!val) return;
      const parts = val.split("/").map((p) => parseInt(p.trim(), 10));
      const sum = parts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
      if (parts.some(isNaN)) {
        errorMsg.text = this.plugin.t("modal.error.format");
        errorMsg.style.display = "block";
        return;
      }
      if (sum !== 100) {
        errorMsg.text = this.plugin.t("modal.error.sum", sum);
        errorMsg.style.display = "block";
        return;
      }
      this.onSubmit(parts.length, parts);
      this.close();
    };
    submitBtn.onclick = validateAndSubmit;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") validateAndSubmit();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var MultiColumnLayoutSettingTab = class extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: this.plugin.t("settings.title") });
    new Setting(containerEl).setName(this.plugin.t("settings.general")).setHeading();
    new Setting(containerEl).setName(this.plugin.t("settings.language")).setDesc(this.plugin.t("settings.language.desc")).addDropdown(
      (dropdown) => dropdown.addOption("en", "English").addOption("zh", "\u7B80\u4F53\u4E2D\u6587").setValue(this.plugin.settings.language).onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    this.addColorDropdown(containerEl, "backgroundColor", this.plugin.t("settings.background"), this.plugin.t("settings.background.desc"));
    new Setting(containerEl).setName(this.plugin.t("settings.border")).setHeading();
    new Setting(containerEl).setName(this.plugin.t("settings.border.enable")).setDesc(this.plugin.t("settings.border.enable.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.borderEnabled).onChange(async (value) => {
        this.plugin.settings.borderEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    this.addPixelControl(
      containerEl,
      "borderWidth",
      this.plugin.t("settings.border.width"),
      ""
    );
    this.addPixelControl(
      containerEl,
      "borderRadius",
      this.plugin.t("settings.border.radius"),
      "",
      { min: 0, max: 2, step: 0.1, unit: "rem" }
    );
    new Setting(containerEl).setName(this.plugin.t("settings.vertical")).setHeading();
    this.addPixelControl(
      containerEl,
      "dividerWidth",
      this.plugin.t("settings.width"),
      this.plugin.t("settings.width.desc")
    );
    new Setting(containerEl).setName(this.plugin.t("settings.style")).setDesc(this.plugin.t("settings.style.desc")).addDropdown(
      (dropdown) => dropdown.addOption("solid", this.plugin.t("style.solid")).addOption("dashed", this.plugin.t("style.dashed")).addOption("dotted", this.plugin.t("style.dotted")).addOption("double", this.plugin.t("style.double")).setValue(this.plugin.settings.dividerStyle).onChange(async (value) => {
        this.plugin.settings.dividerStyle = value;
        await this.plugin.saveSettings();
      })
    );
    this.addColorDropdown(containerEl, "dividerColor", this.plugin.t("settings.color"), this.plugin.t("settings.color.desc"));
    new Setting(containerEl).setName(this.plugin.t("settings.horizontal")).setHeading();
    new Setting(containerEl).setName(this.plugin.t("settings.horz.enable")).setDesc(this.plugin.t("settings.horz.enable.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.horzDivider).onChange(async (value) => {
        this.plugin.settings.horzDivider = value;
        await this.plugin.saveSettings();
      })
    );
    this.addPixelControl(
      containerEl,
      "horzDividerWidth",
      this.plugin.t("settings.width"),
      ""
    );
    new Setting(containerEl).setName(this.plugin.t("settings.style")).addDropdown(
      (dropdown) => dropdown.addOption("solid", this.plugin.t("style.solid")).addOption("dashed", this.plugin.t("style.dashed")).addOption("dotted", this.plugin.t("style.dotted")).addOption("double", this.plugin.t("style.double")).setValue(this.plugin.settings.horzDividerStyle).onChange(async (value) => {
        this.plugin.settings.horzDividerStyle = value;
        await this.plugin.saveSettings();
      })
    );
    this.addColorDropdown(containerEl, "horzDividerColor", this.plugin.t("settings.color"), "");
    const migrateSetting = new Setting(containerEl).setName(this.plugin.t("settings.migrate")).setDesc(this.plugin.t("settings.migrate.desc")).addButton(
      (button) => button.setButtonText(this.plugin.t("settings.migrate")).setCta().onClick(async () => {
        new Notice(this.plugin.t("settings.migrate.running"));
        try {
          const updated = await this.plugin.applyAppearanceToAllFiles();
          new Notice(this.plugin.t("settings.migrate.done", updated));
        } catch (err) {
          console.error(err);
          new Notice(this.plugin.t("settings.migrate.error"));
        }
      })
    );
    migrateSetting.settingEl.addClass("multi-column-apply-all");
  }
  addColorDropdown(containerEl, settingKey, name, desc) {
    new Setting(containerEl).setName(name).setDesc(desc).addDropdown((dropdown) => {
      Object.keys(PRESET_COLORS).forEach((color) => {
        dropdown.addOption(color, this.plugin.colorLabel(color));
      });
      dropdown.setValue(this.plugin.settings[settingKey]);
      dropdown.onChange(async (value) => {
        this.plugin.settings[settingKey] = value;
        await this.plugin.saveSettings();
      });
    });
  }
  addPixelControl(containerEl, settingKey, name, desc, opts = {}) {
    const unit = opts.unit || "px";
    const min = typeof opts.min === "number" ? opts.min : 0;
    const max = typeof opts.max === "number" ? opts.max : 10;
    const step = typeof opts.step === "number" ? opts.step : 0.5;
    const parseNumber = (val) => {
      const num = parseFloat(String(val || "").replace(/[^0-9.]/g, ""));
      return Number.isFinite(num) ? num : 0;
    };
    const clamp = (num, min2, max2) => Math.min(max2, Math.max(min2, num));
    const current = clamp(parseNumber(this.plugin.settings[settingKey]), min, max);
    const setting = new Setting(containerEl).setName(name);
    if (desc) setting.setDesc(desc);
    let textRef;
    let sliderRef;
    const format = (num) => `${num}${unit}`;
    setting.addSlider((slider) => {
      sliderRef = slider;
      slider.setLimits(min, max, step).setValue(current).onChange(async (value) => {
        const n = clamp(parseFloat(value), min, max);
        this.plugin.settings[settingKey] = format(n);
        if (textRef) textRef.setValue(String(n));
        await this.plugin.saveSettings();
      });
    });
    setting.addText((text) => {
      textRef = text;
      text.inputEl.type = "number";
      text.inputEl.min = String(min);
      text.inputEl.max = String(max);
      text.inputEl.step = String(step);
      text.setValue(String(current));
      text.onChange(async (value) => {
        const n = clamp(parseNumber(value), min, max);
        this.plugin.settings[settingKey] = format(n);
        if (sliderRef) sliderRef.setValue(n);
        await this.plugin.saveSettings();
      });
    });
  }
};
module.exports = MultiColumnLayoutPlugin;
