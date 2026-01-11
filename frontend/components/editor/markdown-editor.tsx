"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "@/components/theme-provider";
import { CommandPalette } from "./command-palette";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onScroll?: (scrollTop: number, scrollHeight: number) => void;
    scrollTop?: number;
}

// Light theme
const lightTheme = EditorView.theme({
    "&": {
        backgroundColor: "transparent",
        fontSize: "14px",
        height: "100%",
    },
    ".cm-scroller": {
        overflow: "auto",
    },
    ".cm-content": {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        padding: "16px 0",
    },
    ".cm-line": {
        padding: "0 16px",
    },
    ".cm-gutters": {
        backgroundColor: "transparent",
        border: "none",
        color: "hsl(var(--muted-foreground))",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "hsl(var(--accent) / 0.5)",
    },
    ".cm-activeLine": {
        backgroundColor: "hsl(var(--accent) / 0.3)",
    },
    ".cm-selectionBackground": {
        backgroundColor: "hsl(var(--primary) / 0.2) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "hsl(var(--primary) / 0.3) !important",
    },
    ".cm-cursor": {
        borderLeftColor: "hsl(var(--primary))",
    },
    ".cm-placeholder": {
        color: "hsl(var(--muted-foreground))",
    },
});

export function MarkdownEditor({
    value,
    onChange,
    placeholder = "在此输入 Markdown 内容...",
    className = "",
    onScroll,
    scrollTop,
}: MarkdownEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const { theme } = useTheme();

    // Command palette state
    const [paletteVisible, setPaletteVisible] = useState(false);
    const [palettePosition, setPalettePosition] = useState({ x: 0, y: 0 });
    const [paletteSearch, setPaletteSearch] = useState("");
    const slashPosRef = useRef<number | null>(null);

    // Handle command selection
    const handleCommandSelect = useCallback((template: string) => {
        const view = viewRef.current;
        if (!view || slashPosRef.current === null) return;

        const pos = view.state.selection.main.head;
        view.dispatch({
            changes: { from: slashPosRef.current, to: pos, insert: template },
        });
        setPaletteVisible(false);
        setPaletteSearch("");
        slashPosRef.current = null;
        view.focus();
    }, []);

    // Close palette
    const closePalette = useCallback(() => {
        setPaletteVisible(false);
        setPaletteSearch("");
        slashPosRef.current = null;
    }, []);

    // Create editor on mount
    useEffect(() => {
        if (!editorRef.current) return;

        const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

        const startState = EditorState.create({
            doc: value,
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightActiveLine(),
                history(),
                bracketMatching(),
                closeBrackets(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                markdown({
                    base: markdownLanguage,
                    codeLanguages: languages,
                }),
                highlightSelectionMatches(),
                isDark ? oneDark : lightTheme,
                keymap.of([
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...closeBracketsKeymap,
                    ...searchKeymap,
                    indentWithTab,
                    // Bold: Cmd/Ctrl + B
                    {
                        key: "Mod-b",
                        run: (view) => {
                            const { from, to } = view.state.selection.main;
                            const selectedText = view.state.doc.sliceString(from, to);
                            view.dispatch({
                                changes: { from, to, insert: `**${selectedText}**` },
                                selection: { anchor: from + 2, head: to + 2 },
                            });
                            return true;
                        },
                    },
                    // Italic: Cmd/Ctrl + I
                    {
                        key: "Mod-i",
                        run: (view) => {
                            const { from, to } = view.state.selection.main;
                            const selectedText = view.state.doc.sliceString(from, to);
                            view.dispatch({
                                changes: { from, to, insert: `*${selectedText}*` },
                                selection: { anchor: from + 1, head: to + 1 },
                            });
                            return true;
                        },
                    },
                    // Inline code: Cmd/Ctrl + `
                    {
                        key: "Mod-`",
                        run: (view) => {
                            const { from, to } = view.state.selection.main;
                            const selectedText = view.state.doc.sliceString(from, to);
                            view.dispatch({
                                changes: { from, to, insert: `\`${selectedText}\`` },
                                selection: { anchor: from + 1, head: to + 1 },
                            });
                            return true;
                        },
                    },
                ]),
                // Update listener
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());

                        // Detect slash command trigger
                        const pos = update.state.selection.main.head;
                        const lineStart = update.state.doc.lineAt(pos).from;
                        const textBeforeCursor = update.state.doc.sliceString(lineStart, pos);

                        // Check for / pattern
                        const slashMatch = textBeforeCursor.match(/\/[\w\u4e00-\u9fa5]*$/);
                        if (slashMatch) {
                            const slashPos = pos - slashMatch[0].length;
                            slashPosRef.current = slashPos;

                            // Get cursor position on screen
                            const coords = update.view.coordsAtPos(pos);
                            if (coords) {
                                setPalettePosition({
                                    x: Math.min(coords.left, window.innerWidth - 280),
                                    y: coords.bottom + 4,
                                });
                            }
                            setPaletteSearch(slashMatch[0].slice(1)); // Remove /
                            setPaletteVisible(true);
                        } else {
                            // No slash pattern found - close palette
                            setPaletteVisible(false);
                            setPaletteSearch("");
                            slashPosRef.current = null;
                        }
                    }
                }),
                // Scroll listener
                EditorView.domEventHandlers({
                    scroll: (event, view) => {
                        if (onScroll) {
                            const scrollElement = view.scrollDOM;
                            onScroll(scrollElement.scrollTop, scrollElement.scrollHeight);
                        }
                        return false;
                    },
                }),
                EditorView.lineWrapping,
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [theme]);

    // Sync value from external source
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;

        const currentValue = view.state.doc.toString();
        if (value !== currentValue) {
            view.dispatch({
                changes: { from: 0, to: currentValue.length, insert: value },
            });
        }
    }, [value]);

    // Sync scroll position from prop
    useEffect(() => {
        const view = viewRef.current;
        if (view && scrollTop !== undefined) {
            view.scrollDOM.scrollTop = scrollTop;
        }
    }, [scrollTop]);

    // Listen for bidirectional scroll sync from preview
    useEffect(() => {
        const handleSyncScroll = (e: Event) => {
            const { scrollRatio } = (e as CustomEvent).detail;
            const view = viewRef.current;
            if (view) {
                const editorScrollHeight = view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight;
                view.scrollDOM.scrollTop = scrollRatio * editorScrollHeight;
            }
        };

        window.addEventListener("syncEditorScroll", handleSyncScroll);
        return () => window.removeEventListener("syncEditorScroll", handleSyncScroll);
    }, []);

    return (
        <>
            <div
                ref={editorRef}
                className={`flex-1 overflow-auto ${className}`}
                style={{ minHeight: 0, height: "100%" }}
            />
            <CommandPalette
                visible={paletteVisible}
                position={palettePosition}
                searchText={paletteSearch}
                onSelect={handleCommandSelect}
                onClose={closePalette}
            />
        </>
    );
}
