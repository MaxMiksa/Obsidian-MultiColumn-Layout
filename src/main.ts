import { buildMultiColumnEditorExtensions } from "./editor/extensions";

import {
  MarkdownView,
  type Menu,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  type App,
  type Editor,
  type MarkdownPostProcessorContext
} from "obsidian";

type CM6EditorViewLike = {
  posAtCoords?: (coords: { x: number; y: number }) => number | null;
  state?: { doc?: { lineAt: (pos: number) => { number: number } } };
};

type MultiColumnLayoutLanguage = "en" | "zh";

type MultiColumnLayoutSettings = {
  language: MultiColumnLayoutLanguage;
  dividerWidth: string;
  dividerStyle: string;
  dividerColor: string;
  horzDivider: boolean;
  horzDividerWidth: string;
  horzDividerStyle: string;
  horzDividerColor: string;
  backgroundColor: string;
  borderEnabled: boolean;
  borderWidth: string;
  borderRadius: string;
};

type ColorSettingKey = "backgroundColor" | "dividerColor" | "horzDividerColor";
type PixelSettingKey = "dividerWidth" | "horzDividerWidth" | "borderWidth" | "borderRadius";
type PixelControlOptions = { min?: number; max?: number; step?: number; unit?: string };

const DEFAULT_SETTINGS: MultiColumnLayoutSettings = {
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

const PRESET_COLORS = {
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

const TEXTS = {
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
    "settings.title": "多列布局设置",
    "settings.general": "常规",
    "settings.language": "语言",
    "settings.language.desc": "选择插件显示的语言。",
    "settings.background": "背景颜色",
    "settings.background.desc": "多列布局容器的背景颜色。",
    "settings.border": "边框",
    "settings.border.enable": "显示边框",
    "settings.border.enable.desc": "为多列容器绘制边框，颜色与背景一致但略深。",
    "settings.border.width": "边框宽度",
    "settings.border.radius": "圆角半径",
    "colors.none": "透明",
    "colors.gray": "灰色",
    "colors.red": "红色",
    "colors.orange": "橙色",
    "colors.yellow": "黄色",
    "colors.green": "绿色",
    "colors.cyan": "青色",
    "colors.blue": "蓝色",
    "colors.purple": "紫色",
    "colors.black": "深灰",
    "colors.white": "白色",
    "settings.vertical": "垂直分割线",
    "settings.horizontal": "水平分割线",
    "settings.width": "宽度",
    "settings.width.desc": "线条宽度（例如 1px, 2px）。",
    "settings.style": "样式",
    "settings.style.desc": "线条样式。",
    "style.solid": "实线",
    "style.dashed": "虚线",
    "style.dotted": "点线",
    "style.double": "双线",
    "settings.color": "颜色",
    "settings.color.desc": "线条颜色。",
    "settings.horz.enable": "启用水平分割线",
    "settings.horz.enable.desc": "在新插入的布局上自动添加上下边框。",
    "settings.migrate": "将当前外观应用于所有已写布局",
    "settings.migrate.desc": "把当前的分割线风格同步到库里已有的 multi-column callout，确保统一显示。",
    "settings.migrate.running": "正在应用到已有布局…",
    "settings.migrate.done": "已更新 {0} 个文件。",
    "settings.migrate.error": "应用外观失败，请查看控制台日志。",
    "menu.2col": "2 列",
    "menu.3col": "3 列",
    "menu.nested": "子分栏（分栏中嵌套分栏）",
    "menu.nested.2col": "父列 + 子分栏 2 列",
    "menu.nested.3col": "父列 + 子分栏 3 列",
    "menu.nested.here.2col": "在此处插入子分栏 2 列",
    "menu.nested.here.3col": "在此处插入子分栏 3 列",
    "menu.custom": "自定义分栏...",
    "notice.nested.notInCol": "请把光标放在某一列的内容中，再插入子分栏。",
    "notice.nested.limit": "子分栏仅支持 1 层嵌套。",
    "modal.title": "自定义列比例",
    "modal.instruction": "用斜杠分隔比例（例如 30/70 或 20/30/50），总和必须是 100。",
    "modal.insert": "插入布局",
    "modal.error.format": "格式无效，请用数字加斜杠。",
    "modal.error.sum": "当前总和为 {0}% ，必须是 100%。"
  }
};

const RESIZER_HANDLE_WIDTH_PX = 12;

class MultiColumnLayoutPlugin extends Plugin {
  settings: MultiColumnLayoutSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new MultiColumnLayoutSettingTab(this.app, this));        
    this.applySettingsStyles();

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
        this.addInsertMenu(menu, editor);
      })
    );

    this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      this.applyColumnWidths(el);
      this.attachColumnResizers(el, ctx);
    });

    this.registerEvent(
      this.app.workspace.on("resize", () => {
        this.repositionAllColumnResizers();
      })
    );

    this.registerEditorExtension(buildMultiColumnEditorExtensions(this));       
  }

  getCM6EditorView(markdownView: MarkdownView | null | undefined): CM6EditorViewLike | null {
    const editor = markdownView?.editor;
    if (!editor) return null;

    const editorUnknown = editor as unknown as { cm?: unknown; editorView?: unknown };
    const maybeCM = editorUnknown.cm;
    if (maybeCM && typeof maybeCM === "object") {
      const cmUnknown = maybeCM as { cm?: unknown; editorView?: unknown };
      const nested = cmUnknown.cm ?? cmUnknown.editorView ?? null;
      return nested && typeof nested === "object" ? (nested as CM6EditorViewLike) : null;
    }

    const direct = editorUnknown.cm ?? editorUnknown.editorView ?? null;
    return direct && typeof direct === "object" ? (direct as CM6EditorViewLike) : null;
  }

  t(key: string, ...args: Array<string | number>) {
    const lang = this.settings.language || "en";
    const langKey = (lang in TEXTS ? lang : "en") as keyof typeof TEXTS;
    let str = TEXTS[langKey][key] || TEXTS["en"][key] || key;
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
      bgColor = toRGBA(baseColor, 0.13); // slightly stronger background
      borderColor = toRGBA(baseColor, 0.26); // border a bit heavier than background
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

  addInsertMenu(menu: Menu, editor: Editor) {
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
      
      const subMenu = (item as unknown as { setSubmenu: () => Menu }).setSubmenu();

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
        if(activeEditor) {
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
      const ratio = Array.isArray(ratios) ? ratios[i] : undefined;
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

  applyColumnWidths(el: HTMLElement) {
    const columns = el.querySelectorAll<HTMLElement>('div.callout[data-callout="col"][data-callout-metadata]');
    columns.forEach((col) => {
      const raw = col.getAttribute("data-callout-metadata");
      const width = parseInt(raw, 10);
      if (Number.isFinite(width) && width > 0 && width <= 100) {
        col.style.flex = `0 0 ${width}%`;
      }
    });
  }

  repositionAllColumnResizers() {
    // Keep handles aligned after workspace/pane resize (window resize, sidebar toggles, split changes, etc.).
    requestAnimationFrame(() => {
      const containers = document.querySelectorAll<HTMLElement>('div.callout[data-callout="multi-column"]');
      containers.forEach((container) => {
        const content = container.querySelector<HTMLElement>(":scope > .callout-content") || container.querySelector<HTMLElement>(".callout-content");
        if (!content) return;
        const handles = content.querySelectorAll<HTMLElement>(":scope > .mcl-resizer");
        if (handles.length === 0) return;

        const isColEl = (child: Element): child is HTMLElement =>
          child instanceof HTMLElement && child.matches('div.callout[data-callout="col"]');
        const cols = Array.from(content.children).filter(isColEl);
        if (cols.length < 2) return;

        const topInset = getComputedStyle(container).getPropertyValue("--mcl-divider-inset")?.trim() || "1rem";
        for (let i = 0; i < cols.length - 1; i++) {
          const handle = content.querySelector<HTMLElement>(`:scope > .mcl-resizer[data-index="${i}"]`);
          if (!handle) continue;
          const x = cols[i].offsetLeft + cols[i].offsetWidth;
          handle.style.left = `${x - RESIZER_HANDLE_WIDTH_PX / 2}px`;
          handle.style.top = topInset;
          handle.style.bottom = topInset;
          handle.style.width = `${RESIZER_HANDLE_WIDTH_PX}px`;
        }
      });
    });
  }

  attachColumnResizers(rootEl: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const containers = rootEl.querySelectorAll<HTMLElement>('div.callout[data-callout="multi-column"]');
    containers.forEach((container) => {
      const content = container.querySelector<HTMLElement>(":scope > .callout-content") || container.querySelector<HTMLElement>(".callout-content");
      if (!content) return;
      if (content.classList.contains("mcl-resizing")) return;

      // Remove old handles from previous renders
      content.querySelectorAll(":scope > .mcl-resizer").forEach((el) => el.remove());

      const isColEl = (child: Element): child is HTMLElement =>
        child instanceof HTMLElement && child.matches('div.callout[data-callout="col"]');
      const cols = Array.from(content.children).filter(isColEl);
      if (cols.length < 2) return;

      // Best-effort: infer expected blockquote depth from nesting in [!col] callouts (0 -> 1, 1 -> 3, 2 -> 5 ...).
      try {
        let expectedDepth = 1;
        let parent = container.parentElement;
        while (parent) {
          if (parent instanceof HTMLElement && parent.matches('div.callout[data-callout="col"]')) {
            expectedDepth += 2;
          }
          parent = parent.parentElement;
        }
        container.dataset.mclExpectedDepth = String(expectedDepth);
      } catch {
        delete container.dataset.mclExpectedDepth;
      }

      const section = ctx?.getSectionInfo?.(container) ?? ctx?.getSectionInfo?.(rootEl) ?? null;
      const initialView = this.app.workspace.getActiveViewOfType(MarkdownView);
      const sourcePath = ctx?.sourcePath ?? initialView?.file?.path ?? null;
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

      const positionHandles = () => {
        const topInset = getComputedStyle(container).getPropertyValue("--mcl-divider-inset")?.trim() || "1rem";
        for (let i = 0; i < cols.length - 1; i++) {
          const handle = content.querySelector<HTMLElement>(`:scope > .mcl-resizer[data-index="${i}"]`);
          if (!handle) continue;
          const x = cols[i].offsetLeft + cols[i].offsetWidth;
          handle.style.left = `${x - RESIZER_HANDLE_WIDTH_PX / 2}px`;
          handle.style.top = topInset;
          handle.style.bottom = topInset;
          handle.style.width = `${RESIZER_HANDLE_WIDTH_PX}px`;
        }
      };

      for (let i = 0; i < cols.length - 1; i++) {
        const handle = document.createElement("div");
        handle.className = "mcl-resizer";
        handle.dataset.index = String(i);
        handle.setAttribute("aria-label", "Resize columns");
        // IMPORTANT: insert between columns so CSS selectors like :last-child on columns keep working.
        content.insertBefore(handle, cols[i + 1]);

          const onMouseDown = (ev) => {
            if (ev.button !== 0) return;
            ev.preventDefault();
            ev.stopPropagation();

            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            const editor = view?.editor ?? null;
            if (view?.getMode?.() !== "source" || !editor || !view?.file || (sourcePath && view.file.path !== sourcePath)) {
              new Notice("Please use live preview (editable) to resize columns.");
              return;
            }

          const containerRect = content.getBoundingClientRect();
          const totalWidth = Math.max(1, content.clientWidth);
          const startX = ev.clientX;

          const widths = cols.map((colEl) => colEl.getBoundingClientRect().width);
          const ratios = widths.map((w) => Math.max(1, Math.round((w / totalWidth) * 100)));
          const existingRatiosHint = cols.map((colEl) => {
            const raw = colEl.getAttribute("data-callout-metadata");
            const n = parseInt(String(raw ?? ""), 10);
            return Number.isFinite(n) ? n : null;
          });
          const sum = ratios.reduce((a, b) => a + b, 0);
          if (sum !== 100 && sum > 0) {
            // Normalize to 100 while keeping relative proportions.
            const normalized = ratios.map((r) => Math.max(1, Math.round((r / sum) * 100)));
            const diff = 100 - normalized.reduce((a, b) => a + b, 0);
            normalized[normalized.length - 1] += diff;
            for (let k = 0; k < normalized.length; k++) ratios[k] = normalized[k];
          }

          const idx = i;
          const pairTotal = ratios[idx] + ratios[idx + 1];
          const minPx = 60;
          const minPct = Math.max(1, Math.ceil((minPx / totalWidth) * 100));

          const beforePct = ratios.slice(0, idx).reduce((a, b) => a + b, 0);

          content.classList.add("mcl-resizing");
          document.body.classList.add("mcl-global-resizing");

          const applyRatiosToDOM = () => {
            for (let k = 0; k < cols.length; k++) {
              cols[k].style.flex = `0 0 ${ratios[k]}%`;
              cols[k].setAttribute("data-callout-metadata", String(ratios[k]));
            }
            positionHandles();
          };

          const onMove = (moveEv) => {
            moveEv.preventDefault();
            moveEv.stopPropagation();
            moveEv.stopImmediatePropagation();
            const mouseX = moveEv.clientX;
            const rel = Math.min(Math.max(mouseX - containerRect.left, 0), totalWidth);
            const targetPct = Math.round((rel / totalWidth) * 100);
            let newLeft = targetPct - beforePct;
            newLeft = Math.min(Math.max(newLeft, minPct), pairTotal - minPct);
            ratios[idx] = newLeft;
            ratios[idx + 1] = pairTotal - newLeft;
            applyRatiosToDOM();
          };

          const onUp = (upEv) => {
            upEv.preventDefault();
            upEv.stopPropagation();
            upEv.stopImmediatePropagation();
            window.removeEventListener("mousemove", onMove, true);
            window.removeEventListener("mouseup", onUp, true);
            content.classList.remove("mcl-resizing");
            document.body.classList.remove("mcl-global-resizing");

            // Prevent the synthetic click-on-release from switching Live Preview blocks into source mode.
            const suppressClick = (clickEv) => {
              clickEv.preventDefault();
              clickEv.stopPropagation();
              clickEv.stopImmediatePropagation?.();
            };
            window.addEventListener("click", suppressClick, true);
            window.setTimeout(() => window.removeEventListener("click", suppressClick, true), 0);

            // Ignore click without actual movement.
            if (Math.abs(upEv.clientX - startX) < 1) {
              applyRatiosToDOM();
              return;
            }

            const prevSelections = editor.listSelections();
            const prevScroll = editor.getScrollInfo();

            let lineHint: number | null = null;
            try {
              const cmView = this.getCM6EditorView(view);
              const pos = cmView?.posAtCoords?.({ x: ev.clientX, y: ev.clientY });
              if (typeof pos === "number") {
                if (typeof editor.offsetToPos === "function") {
                  lineHint = editor.offsetToPos(pos).line;
                } else if (cmView?.state?.doc?.lineAt) {
                  lineHint = cmView.state.doc.lineAt(pos).number - 1;
                }
              }
            } catch {
              // best-effort only
            }

            const sectionNow = ctx?.getSectionInfo?.(container) ?? section ?? null;
            if (sectionNow) {
              container.dataset.mclLineStart = String(sectionNow.lineStart);
              container.dataset.mclLineEnd = String(sectionNow.lineEnd);
            }

            this.writeBackColumnRatios(container, ratios, {
              editor,
              sourcePath,
              expectedDepth: container.dataset.mclExpectedDepth,
              lineStart: sectionNow?.lineStart,
              lineEnd: sectionNow?.lineEnd,
              lineHint,
              existingRatiosHint,
              prevSelections,
              prevScroll
            });
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
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = ctx?.editor ?? view?.editor ?? null;
    const activePath = view?.file?.path ?? null;
    const dsPath = containerEl?.dataset?.mclSourcePath ?? null;
    const sourcePath = ctx?.sourcePath ?? dsPath ?? activePath;

    if (!activePath || !editor || (sourcePath && activePath !== sourcePath)) {
      new Notice("Resize applied visually, but write-back requires the note to be open in live preview.");
      return;
    }

    const parseMaybeInt = (v) => {
      const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
      return Number.isFinite(n) ? n : null;
    };

    const lineStart = parseMaybeInt(ctx?.lineStart) ?? parseMaybeInt(containerEl?.dataset?.mclLineStart);
    const lineEnd = parseMaybeInt(ctx?.lineEnd) ?? parseMaybeInt(containerEl?.dataset?.mclLineEnd);
    const expectedDepth = parseMaybeInt(ctx?.expectedDepth) ?? parseMaybeInt(containerEl?.dataset?.mclExpectedDepth);
    const existingRatiosHint: (number | null)[] | null = Array.isArray(ctx?.existingRatiosHint)
      ? ctx.existingRatiosHint
      : null;

    const maxLine = editor.lastLine();
    const cursorLine = editor.getCursor?.().line ?? 0;
    const lineHint = parseMaybeInt(ctx?.lineHint) ?? lineStart ?? cursorLine;

    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
    const expandLines = 10;
    let scanMin = Math.max(0, lineHint - 5000);
    let scanMax = Math.min(maxLine, lineHint + 5000);
    if (lineStart != null) scanMin = Math.max(0, lineStart - expandLines);
    if (lineEnd != null) scanMax = Math.min(maxLine, lineEnd + expandLines);
    if (scanMin > scanMax) {
      const tmp = scanMin;
      scanMin = scanMax;
      scanMax = tmp;
    }
    const anchorLine = clamp(lineHint, scanMin, scanMax);

    const getQuoteDepth = (text) => {
      const m = /^(\s*)(>+)/.exec(text);
      return m ? m[2].length : 0;
    };

    const extractColRatioFromHeader = (lineText) => {
      const m = /\[!col([^\]]*)\]/.exec(lineText);
      if (!m) return null;
      const raw = String(m[1] || "");
      const parts = raw.startsWith("|") ? raw.slice(1).split("|").filter((p) => p.length > 0) : [];
      if (parts.length === 0) return null;
      const n = parseInt(parts[0], 10);
      return Number.isFinite(n) ? n : null;
    };

    const scoreAgainstHint = (colLines) => {
      if (!existingRatiosHint || existingRatiosHint.length !== colLines.length) return null;
      let score = 0;
      for (let i = 0; i < colLines.length; i++) {
        const hinted = existingRatiosHint[i];
        const actual = extractColRatioFromHeader(colLines[i].text);
        if (typeof hinted !== "number") continue;
        if (hinted === actual) score++;
      }
      return score;
    };

    const distanceToHint = (line) => {
      const cursorDistance = Math.abs(line - anchorLine);
      if (lineStart != null && lineEnd != null) {
        const inSection = line >= lineStart && line <= lineEnd;
        return (inSection ? 0 : 10_000) + cursorDistance;
      }
      return cursorDistance;
    };

    const findBestHeaderAndCols = (depthFilter) => {
      let best = null;
      let bestScore = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let line = scanMin; line <= scanMax; line++) {
        const text = editor.getLine(line);
        const m = /^(\s*)(>+)\s*\[!multi-column([^\]]*)\]/.exec(text);
        if (!m) continue;

        const depth = m[2].length;
        if (typeof depthFilter === "number" && depth !== depthFilter) continue;

        const colDepth = depth + 1;
        const colHeaderRe = new RegExp(`^(\\s*)(>{${colDepth}})\\s*\\[!col([^\\]]*)\\]`);

        const scanEnd = Math.min(scanMax, maxLine, line + 2000);
        const colLines: { line: number; text: string }[] = [];

        for (let j = line; j <= scanEnd; j++) {
          const t = editor.getLine(j);
          if (j > line) {
            const qd = getQuoteDepth(t);
            if (qd === 0) break;
            if (qd < depth && t.trim() !== "") break;
          }
          if (colHeaderRe.test(t)) colLines.push({ line: j, text: t });
          if (colLines.length >= ratios.length) break;
        }

        if (colLines.length !== ratios.length) continue;

        const score = scoreAgainstHint(colLines) ?? 0;
        const dist = distanceToHint(line);

        const isBetter =
          score > bestScore ||
          (score === bestScore && dist < bestDistance);

        if (isBetter) {
          bestScore = score;
          bestDistance = dist;
          best = { header: { line, depth }, colLines };
        }
      }

      return best;
    };

    const found =
      findBestHeaderAndCols(expectedDepth) ?? (expectedDepth != null ? findBestHeaderAndCols(null) : null);
    if (!found) {
      new Notice("Resize applied visually, but failed to locate the multi-column block for write-back.");
      return;
    }

    const { colLines } = found;

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

    const changes = colLines
      .map(({ line, text }, idx) => {
        const updated = rewriteColHeader(text, ratios[idx]);
        if (updated === text) return null;
        return {
          from: { line, ch: 0 },
          to: { line, ch: text.length },
          text: updated
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.from.line - a.from.line);

    if (changes.length === 0) return;
    const prevSelections = ctx?.prevSelections ?? editor.listSelections();
    const prevScroll = ctx?.prevScroll ?? editor.getScrollInfo();
    editor.transaction({ changes }, "mcl-resize");
    requestAnimationFrame(() => {
      try {
        editor.setSelections(prevSelections, 0);
        editor.scrollTo(prevScroll.left, prevScroll.top);
        editor.focus();
      } catch {
        // ignore
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
      const parts = metaRaw.startsWith("|")
        ? metaRaw.slice(1).split("|").filter(Boolean)
        : [];

      // Ensure bordered flag exists.
      if (!parts.includes("bordered")) parts.push("bordered");

      // Apply horizontal flag based on current setting.
      const filtered = parts.filter((p) => p !== "horizontal");
      if (hasHorizontal) filtered.push("horizontal");

      const rebuilt = filtered.length > 0 ? `|${filtered.join("|")}` : "";
      return `${prefix}${rebuilt}${suffix}`;
    });
  }

  getColDepthAtCursor(editor) {
    const cursor = editor.getCursor();
    const minLine = Math.max(0, cursor.line - 5000);

    for (let line = cursor.line; line >= minLine; line--) {
      const text = editor.getLine(line);
      const m = /^(\s*)(>+)\s*\[!col([^\]]*)\]/.exec(text);
      if (!m) continue;

      const depth = m[2].length;
      if (depth !== 2 && depth !== 4) continue;

      return depth;
    }

    // Fallback: infer from the current line's blockquote prefix. This helps
    // when the column header is far above the cursor in a long column.
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

      let blockStartLine: number;
      if (insertAfterLine + 1 >= lineCount) {
        const lastLine = lineCount - 1;
        const lastCh = (editor.getLine(lastLine) || "").length;
        editor.replaceRange(`\n${block}`, { line: lastLine, ch: lastCh });
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
}

class CustomRatioModal extends Modal {
  plugin: MultiColumnLayoutPlugin;
  onSubmit: (colCount: number, ratios: number[]) => void;

  constructor(app: App, plugin: MultiColumnLayoutPlugin, onSubmit: (colCount: number, ratios: number[]) => void) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    new Setting(contentEl).setName(this.plugin.t("modal.title")).setHeading();

    const instruction = contentEl.createEl("p", { text: this.plugin.t("modal.instruction") });
    instruction.addClass("mcl-modal-instruction");

    const inputContainer = contentEl.createDiv();
    const input = inputContainer.createEl("input", { type: "text", placeholder: "50/50" });
    input.addClass("mcl-modal-input");
    input.focus();

    const errorMsg = contentEl.createEl("p", { text: "" });
    errorMsg.addClass("mcl-modal-error");

    const btnContainer = contentEl.createDiv();
    btnContainer.addClass("mcl-modal-buttons");

    const submitBtn = btnContainer.createEl("button", { text: this.plugin.t("modal.insert") });
    submitBtn.addClass("mod-cta");

    const showError = (message: string) => {
      errorMsg.textContent = message;
      errorMsg.addClass("is-visible");
    };

    const clearError = () => {
      errorMsg.textContent = "";
      errorMsg.removeClass("is-visible");
    };

    const validateAndSubmit = () => {
      const val = input.value.trim();
      if (!val) return;

      const parts = val.split("/").map((p) => parseInt(p.trim(), 10));
      const sum = parts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);

      if (parts.some(isNaN)) {
        showError(this.plugin.t("modal.error.format"));
        return;
      }

      if (sum !== 100) {
        showError(this.plugin.t("modal.error.sum", sum));
        return;
      }

      clearError();
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
}

class MultiColumnLayoutSettingTab extends PluginSettingTab {
  plugin: MultiColumnLayoutPlugin;

  constructor(app: App, plugin: MultiColumnLayoutPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName(this.plugin.t("settings.title")).setHeading();

    new Setting(containerEl).setName(this.plugin.t("settings.general")).setHeading();

    new Setting(containerEl)
      .setName(this.plugin.t("settings.language"))
      .setDesc(this.plugin.t("settings.language.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("en", "English")
          .addOption("zh", "简体中文")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            if (value !== "en" && value !== "zh") return;
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );
    
    this.addColorDropdown(containerEl, "backgroundColor", this.plugin.t("settings.background"), this.plugin.t("settings.background.desc"));

    new Setting(containerEl).setName(this.plugin.t("settings.border")).setHeading();

    new Setting(containerEl)
      .setName(this.plugin.t("settings.border.enable"))
      .setDesc(this.plugin.t("settings.border.enable.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.borderEnabled)
          .onChange(async (value) => {
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

    new Setting(containerEl)
      .setName(this.plugin.t("settings.style"))
      .setDesc(this.plugin.t("settings.style.desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("solid", this.plugin.t("style.solid"))
          .addOption("dashed", this.plugin.t("style.dashed"))
          .addOption("dotted", this.plugin.t("style.dotted"))
          .addOption("double", this.plugin.t("style.double"))
          .setValue(this.plugin.settings.dividerStyle)
          .onChange(async (value) => {
            this.plugin.settings.dividerStyle = value;
            await this.plugin.saveSettings();
          })
      );

    this.addColorDropdown(containerEl, "dividerColor", this.plugin.t("settings.color"), this.plugin.t("settings.color.desc"));

    new Setting(containerEl).setName(this.plugin.t("settings.horizontal")).setHeading();

    new Setting(containerEl)
      .setName(this.plugin.t("settings.horz.enable"))
      .setDesc(this.plugin.t("settings.horz.enable.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.horzDivider)
          .onChange(async (value) => {
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

    new Setting(containerEl)
      .setName(this.plugin.t("settings.style"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("solid", this.plugin.t("style.solid"))
          .addOption("dashed", this.plugin.t("style.dashed"))
          .addOption("dotted", this.plugin.t("style.dotted"))
          .addOption("double", this.plugin.t("style.double"))
          .setValue(this.plugin.settings.horzDividerStyle)
          .onChange(async (value) => {
            this.plugin.settings.horzDividerStyle = value;
            await this.plugin.saveSettings();
          })
      );

    this.addColorDropdown(containerEl, "horzDividerColor", this.plugin.t("settings.color"), "");

    const migrateSetting = new Setting(containerEl)
      .setName(this.plugin.t("settings.migrate"))
      .setDesc(this.plugin.t("settings.migrate.desc"))
      .addButton((button) =>
        button
          .setButtonText(this.plugin.t("settings.migrate"))
          .setCta()
          .onClick(async () => {
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

  addColorDropdown(containerEl: HTMLElement, settingKey: ColorSettingKey, name: string, desc: string) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addDropdown((dropdown) => {
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

  addPixelControl(
    containerEl: HTMLElement,
    settingKey: PixelSettingKey,
    name: string,
    desc: string,
    opts: PixelControlOptions = {}
  ) {
    const unit = opts.unit || "px";
    const min = typeof opts.min === "number" ? opts.min : 0;
    const max = typeof opts.max === "number" ? opts.max : 10;
    const step = typeof opts.step === "number" ? opts.step : 0.5;

    const parseNumber = (val) => {
      const num = parseFloat(String(val || "").replace(/[^0-9.]/g, ""));
      return Number.isFinite(num) ? num : 0;
    };
    const clamp = (num, min, max) => Math.min(max, Math.max(min, num));
    const current = clamp(parseNumber(this.plugin.settings[settingKey]), min, max);

    const setting = new Setting(containerEl).setName(name);
    if (desc) setting.setDesc(desc);

    let textRef;
    let sliderRef;
    const format = (num) => `${num}${unit}`;

    setting.addSlider((slider) => {
      sliderRef = slider;
      slider.setLimits(min, max, step).setValue(current).onChange(async (value) => {
        const n = clamp(value, min, max);
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
}

module.exports = MultiColumnLayoutPlugin;
