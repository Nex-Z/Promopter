"use client";

import { useState, useRef, useEffect } from "react";
import { Edit2, Trash2, X } from "lucide-react";
import { usePromptStore } from "@/lib/store";
import { updateCategory as dbUpdateCategory, deleteCategory as dbDeleteCategory } from "@/lib/db";

interface CategoryContextMenuProps {
    categoryId: number;
    categoryName: string;
    position: { x: number; y: number };
    onClose: () => void;
}

export function CategoryContextMenu({
    categoryId,
    categoryName,
    position,
    onClose,
}: CategoryContextMenuProps) {
    const [mode, setMode] = useState<"menu" | "rename" | "delete">("menu");
    const [newName, setNewName] = useState(categoryName);
    const [error, setError] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const { categories, loadData } = usePromptStore();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Check for duplicate name
    const isDuplicateName = (name: string) => {
        return categories.some(
            (c) => c.id !== categoryId && c.name.toLowerCase() === name.toLowerCase()
        );
    };

    // Reserved names that cannot be used
    const isReservedName = (name: string) => {
        return ["未分类", "uncategorized"].includes(name.toLowerCase());
    };

    const handleRename = async () => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === categoryName) {
            onClose();
            return;
        }
        if (isReservedName(trimmed)) {
            setError('"未分类" 是保留名称');
            return;
        }
        if (isDuplicateName(trimmed)) {
            setError("已存在同名分类");
            return;
        }
        try {
            await dbUpdateCategory(categoryId, trimmed);
            await loadData();
            onClose();
        } catch (err) {
            setError("重命名失败");
        }
    };



    // Adjust position to keep menu in viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 200),
        y: Math.min(position.y, window.innerHeight - 150),
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-lg"
            style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
        >
            {mode === "menu" && (
                <>
                    <button
                        onClick={() => setMode("rename")}
                        className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                    >
                        <Edit2 className="h-4 w-4" />
                        重命名
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                        onClick={() => setMode("delete")}
                        className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        删除
                    </button>
                </>
            )}

            {mode === "rename" && (
                <div className="p-2">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">重命名分类</span>
                        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => {
                            setNewName(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") onClose();
                        }}
                        className={`w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none ${error ? "border-red-500" : "border-input focus:border-primary"
                            }`}
                        autoFocus
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                    <div className="mt-2 flex justify-end gap-1">
                        <button
                            onClick={onClose}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleRename}
                            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                            确定
                        </button>
                    </div>
                </div>
            )}

            {mode === "delete" && (
                <div className="p-2">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                        删除分类？
                    </div>
                    <p className="mb-3 text-xs text-sidebar-foreground/80">
                        提示词将移至"未分类"
                    </p>
                    <div className="flex justify-end gap-1">
                        <button
                            onClick={() => setMode("menu")}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                            取消
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await dbDeleteCategory(categoryId);
                                    await loadData();
                                    onClose();
                                } catch (err) {
                                    console.error("Failed to delete category:", err);
                                    setError("删除失败");
                                }
                            }}
                            className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                        >
                            确认删除
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
