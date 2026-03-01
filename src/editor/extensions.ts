import { EditorSelection, Prec, Transaction, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

type ColumnContext = {
  prefixBare: string;
  prefixWithSpace: string;
  colDepth: number;
  colHeaderLineNumber: number;
};

type EditorFeatureSettings = {
  markdownExitOnEmptyEnter?: boolean;
};

type EditorFeaturePlugin = {
  settings?: EditorFeatureSettings;
};

function insertNewlineWithColumnPrefix(view: EditorView, ctx: ColumnContext): boolean {
  const range = view.state.selection.main;
  const insertText = `\n${ctx.prefixWithSpace}`;
  const anchor = range.from + insertText.length;

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: insertText },
    selection: EditorSelection.cursor(anchor),
    annotations: Transaction.userEvent.of("input.enter")
  });

  return true;
}

function findEnclosingMultiColumnContainer(
  view: EditorView,
  fromLine: number,
  expectedDepth: number
): boolean {
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

function getColumnContext(view: EditorView): ColumnContext | null {
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
    return {
      prefixBare,
      prefixWithSpace: `${prefixBare} `,
      colDepth,
      colHeaderLineNumber: lineNumber
    };
  }

  return null;
}

function hasUnquotedBoundarySinceColHeader(
  doc: EditorView["state"]["doc"],
  colHeaderLineNumber: number,
  currentLineNumber: number
): boolean {
  const start = Math.max(1, colHeaderLineNumber + 1);
  for (let lineNumber = start; lineNumber <= currentLineNumber; lineNumber++) {
    const text = doc.line(lineNumber).text;
    if (!/^\s*>/.test(text)) return true;
  }
  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPrefixOnlyLine(lineText: string, ctx: ColumnContext): boolean {
  const re = new RegExp(`^${escapeRegExp(ctx.prefixBare)}\\s*$`);
  return re.test(lineText);
}

function clearCurrentLineAndKeepCursor(view: EditorView): boolean {
  const range = view.state.selection.main;
  if (!range.empty) return false;

  const line = view.state.doc.lineAt(range.from);
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: "" },
    selection: EditorSelection.cursor(line.from),
    annotations: Transaction.userEvent.of("input.enter")
  });
  return true;
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function buildPrefixedPasteText(
  ctx: ColumnContext,
  clipboardText: string,
  opts: { prefixFirstLine: boolean }
): string | null {
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

  const suffix = rest
    .map((line) => {
      if (line.length === 0) return `\n${ctx.prefixBare}`;
      return `\n${ctx.prefixWithSpace}${line}`;
    })
    .join("");

  return `${firstWithPrefix}${suffix}`;
}

export function buildMultiColumnEditorExtensions(plugin: EditorFeaturePlugin): Extension[] {
  return [
    Prec.high(
      keymap.of([
        {
          key: "Enter",
          run(view: EditorView) {
            const ctx = getColumnContext(view);
            if (!ctx) return false;

            const markdownExitOnEmptyEnter = Boolean(plugin.settings?.markdownExitOnEmptyEnter);
            if (!markdownExitOnEmptyEnter) {
              return insertNewlineWithColumnPrefix(view, ctx);
            }

            const range = view.state.selection.main;
            const line = view.state.doc.lineAt(range.from);
            if (
              hasUnquotedBoundarySinceColHeader(
                view.state.doc,
                ctx.colHeaderLineNumber,
                line.number
              )
            ) {
              return false;
            }

            if (range.empty && isPrefixOnlyLine(line.text, ctx)) {
              return clearCurrentLineAndKeepCursor(view);
            }

            return insertNewlineWithColumnPrefix(view, ctx);
          }
        }
      ])
    ),
    EditorView.domEventHandlers({
      paste(event: ClipboardEvent, view: EditorView) {
        const ctx = getColumnContext(view);
        if (!ctx) return;

        const markdownExitOnEmptyEnter = Boolean(plugin.settings?.markdownExitOnEmptyEnter);
        const range = view.state.selection.main;
        const line = view.state.doc.lineAt(range.from);
        if (
          markdownExitOnEmptyEnter &&
          hasUnquotedBoundarySinceColHeader(view.state.doc, ctx.colHeaderLineNumber, line.number)
        ) {
          return;
        }

        const clipboardText = event.clipboardData?.getData("text/plain");
        if (!clipboardText) return;

        const prefixEndInLine = line.text.startsWith(ctx.prefixWithSpace)
          ? ctx.prefixWithSpace.length
          : ctx.prefixBare.length;
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
