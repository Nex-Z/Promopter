"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, Code, Eye, Columns2, Play, History, Save, GitCompare } from "lucide-react";
import { usePromptStore, useActivePrompt } from "@/lib/store";
import { MarkdownEditor, MarkdownPreview } from "@/components/editor";
import { VersionPanel, DiffView } from "@/components/version";

interface Tab {
    id: number;
    title: string;
    isDirty: boolean;
}

export function EditorGroup() {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [viewMode, setViewMode] = useState<"code" | "preview" | "split" | "diff">("split");
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [compareContent, setCompareContent] = useState<string | null>(null);

    // Split view state
    const [splitRatio, setSplitRatio] = useState(0.5); // 0-1, left pane width ratio
    const [isDragging, setIsDragging] = useState(false);

    const previewRef = useRef<HTMLDivElement>(null);
    const isScrollSyncing = useRef(false);

    const { activePromptId, selectPrompt, savePrompt, showVersionPanel, toggleVersionPanel } = usePromptStore();
    const activePrompt = useActivePrompt();

    // Sync tabs with active prompt
    useEffect(() => {
        if (activePrompt) {
            setTabs((prev) => {
                const exists = prev.find((t) => t.id === activePrompt.id);
                if (exists) {
                    return prev.map((t) =>
                        t.id === activePrompt.id ? { ...t, title: activePrompt.title } : t
                    );
                }
                return [...prev, { id: activePrompt.id, title: activePrompt.title, isDirty: false }];
            });
            setEditContent(activePrompt.content);
            setEditTitle(activePrompt.title);
        }
    }, [activePrompt]);

    // Reset diff view when changing prompts
    useEffect(() => {
        setCompareContent(null);
        if (viewMode === "diff") {
            setViewMode("split");
        }
    }, [activePromptId]);

    // Mark tab as dirty when content changes
    const handleContentChange = (value: string) => {
        setEditContent(value);
        if (activePromptId) {
            setTabs((prev) =>
                prev.map((t) => (t.id === activePromptId ? { ...t, isDirty: true } : t))
            );
        }
    };

    const handleTitleChange = (value: string) => {
        setEditTitle(value);
        if (activePromptId) {
            setTabs((prev) =>
                prev.map((t) => (t.id === activePromptId ? { ...t, isDirty: true, title: value } : t))
            );
        }
    };

    // Bidirectional scroll sync: editor -> preview
    const handleEditorScroll = useCallback((scrollTop: number, scrollHeight: number) => {
        if (isScrollSyncing.current || viewMode !== "split" || !previewRef.current) return;
        isScrollSyncing.current = true;
        const previewScrollHeight = previewRef.current.scrollHeight - previewRef.current.clientHeight;
        const editorScrollHeight = scrollHeight - previewRef.current.clientHeight;
        const scrollRatio = editorScrollHeight > 0 ? scrollTop / editorScrollHeight : 0;
        previewRef.current.scrollTop = scrollRatio * previewScrollHeight;
        requestAnimationFrame(() => { isScrollSyncing.current = false; });
    }, [viewMode]);

    // Bidirectional scroll sync: preview -> editor
    const handlePreviewScroll = useCallback(() => {
        if (isScrollSyncing.current || viewMode !== "split" || !previewRef.current) return;
        isScrollSyncing.current = true;
        const previewScrollTop = previewRef.current.scrollTop;
        const previewScrollHeight = previewRef.current.scrollHeight - previewRef.current.clientHeight;
        const scrollRatio = previewScrollHeight > 0 ? previewScrollTop / previewScrollHeight : 0;
        window.dispatchEvent(new CustomEvent("syncEditorScroll", { detail: { scrollRatio } }));
        requestAnimationFrame(() => { isScrollSyncing.current = false; });
    }, [viewMode]);

    // Attach preview scroll listener
    useEffect(() => {
        const preview = previewRef.current;
        if (preview && viewMode === "split") {
            preview.addEventListener("scroll", handlePreviewScroll);
            return () => preview.removeEventListener("scroll", handlePreviewScroll);
        }
    }, [viewMode, handlePreviewScroll]);

    // Save current prompt
    const handleSave = useCallback(async () => {
        if (!activePromptId || isSaving) return;

        setIsSaving(true);
        try {
            await savePrompt(activePromptId, editTitle, editContent);
            setTabs((prev) =>
                prev.map((t) => (t.id === activePromptId ? { ...t, isDirty: false } : t))
            );
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    }, [activePromptId, editTitle, editContent, savePrompt, isSaving]);

    // Keyboard shortcut for save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave]);

    const closeTab = (id: number) => {
        const filtered = tabs.filter((t) => t.id !== id);
        setTabs(filtered);

        // Schedule selectPrompt for next tick to avoid setState during render
        if (filtered.length > 0 && activePromptId === id) {
            setTimeout(() => selectPrompt(filtered[filtered.length - 1].id), 0);
        } else if (filtered.length === 0) {
            setTimeout(() => selectPrompt(null), 0);
        }
    };

    const selectTab = (id: number) => {
        selectPrompt(id);
    };

    const handleCompare = (versionContent: string) => {
        setCompareContent(versionContent);
        setViewMode("diff");
    };

    const activeTab = tabs.find((t) => t.id === activePromptId);

    return (
        <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
                {/* Tab bar */}
                <div className="flex h-9 items-center border-b border-border bg-muted/30">
                    <div className="flex flex-1 items-center overflow-x-auto">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => selectTab(tab.id)}
                                className={`group flex h-9 min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 border-r border-border px-3 ${activePromptId === tab.id
                                    ? "bg-background text-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-accent/50"
                                    }`}
                            >
                                <span className="flex-1 truncate text-sm">{tab.title}</span>
                                {tab.isDirty && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                    className="rounded p-0.5 opacity-0 hover:bg-accent group-hover:opacity-100"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor toolbar */}
                {activeTab && (
                    <div className="relative flex h-10 items-center justify-between border-b border-border px-3">
                        {/* Left: Save button */}
                        <div className="flex items-center">
                            <button
                                onClick={handleSave}
                                disabled={!activeTab.isDirty || isSaving}
                                className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${activeTab.isDirty
                                    ? "text-primary hover:bg-accent"
                                    : "text-muted-foreground cursor-not-allowed"
                                    }`}
                                title="保存 (⌘S)"
                            >
                                <Save className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Center: View mode toggle */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-md bg-muted p-0.5">
                            <button
                                onClick={() => setViewMode("code")}
                                className={`rounded p-1.5 transition-colors ${viewMode === "code"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                title="源码视图"
                            >
                                <Code className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("preview")}
                                className={`rounded p-1.5 transition-colors ${viewMode === "preview"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                title="预览视图"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("split")}
                                className={`rounded p-1.5 transition-colors ${viewMode === "split"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                title="双栏视图"
                            >
                                <Columns2 className="h-4 w-4" />
                            </button>
                            {compareContent && (
                                <button
                                    onClick={() => setViewMode("diff")}
                                    className={`rounded p-1.5 transition-colors ${viewMode === "diff"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    title="对比视图"
                                >
                                    <GitCompare className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                className="flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                title="运行测试"
                            >
                                <Play className="h-4 w-4" />
                            </button>
                            <button
                                onClick={toggleVersionPanel}
                                className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${showVersionPanel
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                title="版本历史"
                            >
                                <History className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Editor content */}
                <div className="flex flex-1 overflow-hidden">
                    {activePrompt ? (
                        viewMode === "diff" && compareContent ? (
                            <DiffView
                                oldContent={compareContent}
                                newContent={editContent}
                                oldLabel="历史版本"
                                newLabel="当前内容"
                                onClose={() => {
                                    setCompareContent(null);
                                    setViewMode("split");
                                }}
                            />
                        ) : (
                            <>
                                {/* Code editor */}
                                {(viewMode === "code" || viewMode === "split") && (
                                    <div
                                        className={`flex flex-col overflow-hidden ${viewMode === "split" ? "" : "flex-1"}`}
                                        style={viewMode === "split" ? { width: `${splitRatio * 100}%` } : undefined}
                                    >
                                        {/* Markdown editor */}
                                        <MarkdownEditor
                                            value={editContent}
                                            onChange={handleContentChange}
                                            onScroll={handleEditorScroll}
                                            placeholder="在此输入 Markdown 内容...

支持的格式：
- **粗体** (⌘B)
- *斜体* (⌘I)
- `代码` (⌘\`)
- ## 标题
- - 列表
- [x] 任务列表
- $数学公式$
- ```代码块```
- | 表格 |"
                                        />
                                    </div>
                                )}

                                {/* Draggable divider (only in split mode) */}
                                {viewMode === "split" && (
                                    <div
                                        className={`w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors ${isDragging ? "bg-primary" : ""}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                            const startX = e.clientX;
                                            const startRatio = splitRatio;
                                            const container = e.currentTarget.parentElement;
                                            if (!container) return;
                                            const containerWidth = container.clientWidth;

                                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                                const deltaX = moveEvent.clientX - startX;
                                                const newRatio = Math.max(0.2, Math.min(0.8, startRatio + deltaX / containerWidth));
                                                setSplitRatio(newRatio);
                                            };

                                            const handleMouseUp = () => {
                                                setIsDragging(false);
                                                document.removeEventListener("mousemove", handleMouseMove);
                                                document.removeEventListener("mouseup", handleMouseUp);
                                            };

                                            document.addEventListener("mousemove", handleMouseMove);
                                            document.addEventListener("mouseup", handleMouseUp);
                                        }}
                                    />
                                )}

                                {/* Preview */}
                                {(viewMode === "preview" || viewMode === "split") && (
                                    <div
                                        ref={previewRef}
                                        className={`overflow-auto p-6 ${viewMode === "split" ? "" : "flex-1"}`}
                                        style={viewMode === "split" ? { width: `${(1 - splitRatio) * 100}%` } : undefined}
                                    >
                                        <MarkdownPreview
                                            content={editContent}
                                            title={editTitle || "无标题"}
                                        />
                                    </div>
                                )}
                            </>
                        )
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <p className="text-lg">没有打开的文件</p>
                                <p className="mt-1 text-sm">从侧边栏选择一个提示词开始编辑，或点击 + 新建</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Version Panel */}
            <VersionPanel content={editContent} onCompare={handleCompare} />
        </div>
    );
}
