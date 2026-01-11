"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronRight, ChevronDown, FileText, Plus, Search, Sun, Moon, Monitor, Trash2, FolderPlus, Tag } from "lucide-react";
import type { ActivityType } from "./app-shell";
import { usePromptStore } from "@/lib/store";
import { useTheme } from "@/components/theme-provider";
import { NewTagDialog, PromptContextMenu, CategoryContextMenu } from "@/components/prompt";

interface SidebarProps {
    activeActivity: ActivityType;
    width: number;
    onWidthChange: (width: number) => void;
}

export function Sidebar({ activeActivity, width }: SidebarProps) {
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
    const [showNewTagDialog, setShowNewTagDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        promptId: number;
        promptTitle: string;
        categoryId: number | null;
        position: { x: number; y: number };
    } | null>(null);
    const [categoryContextMenu, setCategoryContextMenu] = useState<{
        categoryId: number;
        categoryName: string;
        position: { x: number; y: number };
    } | null>(null);

    // VSCode-style inline creation
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [creatingPromptIn, setCreatingPromptIn] = useState<number | null | "none">("none"); // null = uncategorized, "none" = not creating
    const [newPromptName, setNewPromptName] = useState("");
    const newPromptInputRef = useRef<HTMLInputElement>(null);

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const newCategoryInputRef = useRef<HTMLInputElement>(null);

    const { theme, setTheme } = useTheme();
    const {
        prompts,
        categories,
        tags,
        activePromptId,
        isLoading,
        loadData,
        selectPrompt,
        removePrompt,
        duplicatePrompt,
        createNewPrompt,
        addCategory,
    } = usePromptStore();

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Keyboard shortcuts for sidebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle when sidebar has focus (not in editor)
            if (document.activeElement?.closest(".cm-editor")) return;

            // Cmd/Ctrl + D = duplicate active prompt
            if ((e.metaKey || e.ctrlKey) && e.key === "d" && activePromptId) {
                e.preventDefault();
                duplicatePrompt(activePromptId);
            }
            // Delete/Backspace = delete active prompt
            if ((e.key === "Delete" || e.key === "Backspace") && activePromptId) {
                // Don't delete if typing in an input
                if (document.activeElement?.tagName === "INPUT") return;
                e.preventDefault();
                removePrompt(activePromptId);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [activePromptId, duplicatePrompt, removePrompt]);

    // Auto-expand categories with prompts (including uncategorized)
    useEffect(() => {
        const catsWithPrompts = categories
            .filter((cat) => prompts.some((p) => p.category_id === cat.id))
            .map((cat) => cat.id);
        // Add -1 for uncategorized if there are any
        const hasUncategorized = prompts.some((p) => p.category_id === null);
        setExpandedCategories(hasUncategorized ? [-1, ...catsWithPrompts] : catsWithPrompts);
    }, [categories, prompts]);

    const toggleCategory = (id: number) => {
        setExpandedCategories((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Start inline category creation
    const handleStartCreateCategory = () => {
        setIsCreatingCategory(true);
        setNewCategoryName("");
    };

    // Create category from inline input
    const handleCreateCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            setIsCreatingCategory(false);
            return;
        }
        // Check duplicate
        const isDuplicate = categories.some(
            c => c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (isDuplicate) {
            alert("分类名称已存在");
            return;
        }
        // Check reserved name
        if (["未分类", "uncategorized"].includes(trimmed.toLowerCase())) {
            alert('"未分类" 是保留名称');
            return;
        }

        try {
            await addCategory(trimmed);
            setIsCreatingCategory(false);
            setNewCategoryName("");
        } catch (err) {
            console.error(err);
        }
    };

    // Cancel inline category creation
    const handleCancelCreateCategory = () => {
        setIsCreatingCategory(false);
        setNewCategoryName("");
    };

    // Start inline creation
    const handleStartCreate = () => {
        const targetCategory = selectedCategoryId; // null = uncategorized
        setCreatingPromptIn(targetCategory);
        setNewPromptName("");
        // Auto-expand target category
        if (targetCategory === null) {
            if (!expandedCategories.includes(-1)) {
                setExpandedCategories(prev => [...prev, -1]);
            }
        } else {
            if (!expandedCategories.includes(targetCategory)) {
                setExpandedCategories(prev => [...prev, targetCategory]);
            }
        }
    };

    // Create prompt from inline input
    const handleCreatePrompt = async () => {
        const trimmed = newPromptName.trim();
        if (!trimmed) {
            setCreatingPromptIn("none");
            return;
        }
        // Check duplicate
        const targetCatId = creatingPromptIn === "none" ? null : creatingPromptIn;
        const isDuplicate = prompts.some(
            p => p.title.toLowerCase() === trimmed.toLowerCase() && p.category_id === targetCatId
        );
        if (isDuplicate) {
            // Could show error, for now just alert
            alert("该分类下已存在同名提示词");
            return;
        }
        try {
            await createNewPrompt(trimmed, targetCatId);
            setCreatingPromptIn("none");
            setNewPromptName("");
        } catch (err) {
            console.error(err);
        }
    };

    // Cancel inline creation
    const handleCancelCreate = () => {
        setCreatingPromptIn("none");
        setNewPromptName("");
    };

    // Auto-focus input when creating
    useEffect(() => {
        if (creatingPromptIn !== "none" && newPromptInputRef.current) {
            newPromptInputRef.current.focus();
        }
    }, [creatingPromptIn]);

    useEffect(() => {
        if (isCreatingCategory && newCategoryInputRef.current) {
            newCategoryInputRef.current.focus();
        }
    }, [isCreatingCategory]);

    // Filter prompts by search
    const filteredPrompts = searchQuery
        ? prompts.filter(
            (p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : prompts;

    // Sort prompts by title
    const sortedPrompts = [...filteredPrompts].sort((a, b) =>
        a.title.localeCompare(b.title, "zh-CN")
    );

    // Group prompts by category (including uncategorized)
    const uncategorizedPrompts = sortedPrompts.filter((p) => p.category_id === null);
    const categorizedGroups = categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
        .map((cat) => ({
            ...cat,
            prompts: sortedPrompts.filter((p) => p.category_id === cat.id),
            isUncategorized: false,
        }));

    return (
        <>
            <div
                className="flex flex-col border-r border-border bg-sidebar"
                style={{ width: `${width}px`, minWidth: "180px", maxWidth: "400px" }}
            >
                {/* Header */}
                <div className="flex h-9 items-center justify-between border-b border-border px-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
                        {activeActivity === "explorer" && "资源管理器"}
                        {activeActivity === "tags" && "标签"}
                        {activeActivity === "test" && "测试"}
                        {activeActivity === "settings" && "设置"}
                    </span>
                    <div className="flex items-center gap-1">
                        {activeActivity === "explorer" && (
                            <>
                                <button
                                    onClick={() => setShowSearch(!showSearch)}
                                    className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    title="搜索"
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleStartCreateCategory}
                                    className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    title="新建分类"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleStartCreate}
                                    className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    title="新建提示词"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </>
                        )}
                        {activeActivity === "tags" && (
                            <button
                                onClick={() => setShowNewTagDialog(true)}
                                className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                title="新建标签"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search bar */}
                {showSearch && activeActivity === "explorer" && (
                    <div className="border-b border-border p-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索提示词..."
                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                            autoFocus
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {activeActivity === "explorer" && (
                        <div className="space-y-1">
                            {isLoading ? (
                                <div className="p-2 text-sm text-sidebar-foreground/60">加载中...</div>
                            ) : (
                                <>
                                    {/* Uncategorized prompts */}
                                    {/* Uncategorized prompts - show if has prompts OR if creating in uncategorized */}
                                    {(uncategorizedPrompts.length > 0 || creatingPromptIn === null) && (
                                        <div>
                                            <button
                                                onClick={() => {
                                                    toggleCategory(-1);
                                                    setSelectedCategoryId(null);
                                                }}
                                                className={`flex w-full items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${selectedCategoryId === null
                                                    ? "bg-sidebar-accent text-sidebar-foreground"
                                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                                    }`}
                                            >
                                                {expandedCategories.includes(-1) ? (
                                                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                                                )}
                                                <span className="font-medium text-muted-foreground">未分类</span>
                                                <span className="ml-auto text-xs text-sidebar-foreground/40">
                                                    {uncategorizedPrompts.length}
                                                </span>
                                            </button>
                                            {expandedCategories.includes(-1) && (
                                                <div className="ml-4 space-y-0.5">
                                                    {/* Inline creation input */}
                                                    {creatingPromptIn === null && (
                                                        <div className="flex items-center gap-2 px-2 py-1">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <input
                                                                ref={newPromptInputRef}
                                                                type="text"
                                                                value={newPromptName}
                                                                onChange={(e) => setNewPromptName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleCreatePrompt();
                                                                    if (e.key === "Escape") handleCancelCreate();
                                                                }}
                                                                onBlur={handleCancelCreate}
                                                                placeholder="输入名称..."
                                                                className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-primary"
                                                            />
                                                        </div>
                                                    )}
                                                    {uncategorizedPrompts.map((prompt) => (
                                                        <div
                                                            key={prompt.id}
                                                            className={`group flex w-full items-center gap-2 rounded px-2 py-1 text-sm transition-colors cursor-pointer ${activePromptId === prompt.id
                                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                                                                }`}
                                                            onClick={() => selectPrompt(prompt.id)}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                setContextMenu({
                                                                    promptId: prompt.id,
                                                                    promptTitle: prompt.title,
                                                                    categoryId: prompt.category_id,
                                                                    position: { x: e.clientX, y: e.clientY },
                                                                });
                                                            }}
                                                        >
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <span className="flex-1 truncate">{prompt.title}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removePrompt(prompt.id);
                                                                }}
                                                                className="rounded p-0.5 opacity-0 hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                                                                title="删除"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Categorized prompts */}
                                    {isCreatingCategory && (
                                        <div className="flex items-center gap-2 px-2 py-1 ml-2">
                                            <ChevronRight className="h-4 w-4 text-sidebar-foreground/60 invisible" />
                                            <input
                                                ref={newCategoryInputRef}
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleCreateCategory();
                                                    if (e.key === "Escape") handleCancelCreateCategory();
                                                }}
                                                onBlur={handleCancelCreateCategory}
                                                placeholder="输入分类名称..."
                                                className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-primary"
                                            />
                                        </div>
                                    )}
                                    {categorizedGroups.map((category) => (
                                        <div key={category.id}>
                                            {/* Category header */}
                                            <button
                                                onClick={() => {
                                                    toggleCategory(category.id);
                                                    setSelectedCategoryId(category.id);
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setCategoryContextMenu({
                                                        categoryId: category.id,
                                                        categoryName: category.name,
                                                        position: { x: e.clientX, y: e.clientY },
                                                    });
                                                }}
                                                className={`flex w-full items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${selectedCategoryId === category.id
                                                    ? "bg-sidebar-accent text-sidebar-foreground"
                                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                                    }`}
                                            >
                                                {expandedCategories.includes(category.id) ? (
                                                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                                                )}
                                                <span className="font-medium">{category.name}</span>
                                                <span className="ml-auto text-xs text-sidebar-foreground/40">
                                                    {category.prompts.length}
                                                </span>
                                            </button>

                                            {/* Prompts */}
                                            {expandedCategories.includes(category.id) && (
                                                <div className="ml-4 space-y-0.5">
                                                    {/* Inline creation input for this category */}
                                                    {creatingPromptIn === category.id && (
                                                        <div className="flex items-center gap-2 px-2 py-1">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <input
                                                                ref={newPromptInputRef}
                                                                type="text"
                                                                value={newPromptName}
                                                                onChange={(e) => setNewPromptName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleCreatePrompt();
                                                                    if (e.key === "Escape") handleCancelCreate();
                                                                }}
                                                                onBlur={handleCancelCreate}
                                                                placeholder="输入名称..."
                                                                className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-primary"
                                                            />
                                                        </div>
                                                    )}
                                                    {category.prompts.map((prompt) => (
                                                        <div
                                                            key={prompt.id}
                                                            className={`group flex w-full items-center gap-2 rounded px-2 py-1 text-sm transition-colors cursor-pointer ${activePromptId === prompt.id
                                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                                                                }`}
                                                            onClick={() => selectPrompt(prompt.id)}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                setContextMenu({
                                                                    promptId: prompt.id,
                                                                    promptTitle: prompt.title,
                                                                    categoryId: prompt.category_id,
                                                                    position: { x: e.clientX, y: e.clientY },
                                                                });
                                                            }}
                                                        >
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <span className="flex-1 truncate">{prompt.title}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removePrompt(prompt.id);
                                                                }}
                                                                className="rounded p-0.5 opacity-0 hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                                                                title="删除"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Empty state */}
                                    {uncategorizedPrompts.length === 0 && categorizedGroups.every(c => c.prompts.length === 0) && (
                                        <div className="p-2 text-sm text-sidebar-foreground/60">暂无数据</div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeActivity === "tags" && (
                        <div className="space-y-1">
                            {tags.length === 0 ? (
                                <div className="p-2 text-sm text-sidebar-foreground/60">暂无标签</div>
                            ) : (
                                tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
                                    >
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span>{tag.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {activeActivity === "test" && (
                        <div className="p-2 text-sm text-sidebar-foreground/60">
                            配置 API 密钥后可在此测试提示词效果
                        </div>
                    )}

                    {activeActivity === "settings" && (
                        <div className="space-y-4 p-2">
                            {/* Theme toggle */}
                            <div>
                                <div className="mb-2 text-sm font-medium text-sidebar-foreground">主题</div>
                                <div className="flex items-center gap-1 rounded-md bg-sidebar-accent p-1">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-xs transition-colors ${theme === "light"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                                            }`}
                                    >
                                        <Sun className="h-3.5 w-3.5" />
                                        <span>浅色</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-xs transition-colors ${theme === "dark"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                                            }`}
                                    >
                                        <Moon className="h-3.5 w-3.5" />
                                        <span>深色</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("system")}
                                        className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-xs transition-colors ${theme === "system"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                                            }`}
                                    >
                                        <Monitor className="h-3.5 w-3.5" />
                                        <span>系统</span>
                                    </button>
                                </div>
                            </div>

                            {/* Other settings */}
                            <div>
                                <div className="mb-2 text-sm font-medium text-sidebar-foreground">API 配置</div>
                                <div className="text-xs text-sidebar-foreground/60">点击配置 API 密钥...</div>
                            </div>

                            <div>
                                <div className="mb-2 text-sm font-medium text-sidebar-foreground">数据</div>
                                <div className="text-xs text-sidebar-foreground/60">导入 / 导出数据...</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Tag Dialog */}
            <NewTagDialog
                open={showNewTagDialog}
                onClose={() => setShowNewTagDialog(false)}
            />

            {/* Prompt Context Menu */}
            {contextMenu && (
                <PromptContextMenu
                    promptId={contextMenu.promptId}
                    promptTitle={contextMenu.promptTitle}
                    currentCategoryId={contextMenu.categoryId}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* Category Context Menu */}
            {categoryContextMenu && (
                <CategoryContextMenu
                    categoryId={categoryContextMenu.categoryId}
                    categoryName={categoryContextMenu.categoryName}
                    position={categoryContextMenu.position}
                    onClose={() => setCategoryContextMenu(null)}
                />
            )}
        </>
    );
}
