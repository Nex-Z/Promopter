"use client";

import { useState, useRef, useEffect } from "react";
import { Edit2, FolderOpen, Copy, Trash2, X } from "lucide-react";
import { usePromptStore } from "@/lib/store";

interface PromptContextMenuProps {
    promptId: number;
    promptTitle: string;
    currentCategoryId: number | null;
    position: { x: number; y: number };
    onClose: () => void;
}

export function PromptContextMenu({
    promptId,
    promptTitle,
    currentCategoryId,
    position,
    onClose,
}: PromptContextMenuProps) {
    const [mode, setMode] = useState<"menu" | "rename" | "move" | "copy">("menu");
    const [newTitle, setNewTitle] = useState(promptTitle);
    const [copyTitle, setCopyTitle] = useState(`${promptTitle} (副本)`);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(currentCategoryId);
    const [copyCategory, setCopyCategory] = useState<number | null>(currentCategoryId);
    const menuRef = useRef<HTMLDivElement>(null);

    const { categories, prompts, savePrompt, movePrompt, copyPromptTo, removePrompt } = usePromptStore();

    // Get current prompt content for rename
    const currentPrompt = prompts.find((p) => p.id === promptId);

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

    // Check for duplicate title in category
    const isDuplicateTitle = (title: string, catId: number | null, excludeId?: number) => {
        return prompts.some(
            (p) =>
                (excludeId ? p.id !== excludeId : true) &&
                p.title.toLowerCase() === title.toLowerCase() &&
                p.category_id === catId
        );
    };

    const handleRename = async () => {
        const trimmed = newTitle.trim();
        if (!trimmed || trimmed === promptTitle) {
            onClose();
            return;
        }
        if (isDuplicateTitle(trimmed, currentCategoryId, promptId)) {
            alert("该分类下已存在同名提示词");
            return;
        }
        if (currentPrompt) {
            await savePrompt(promptId, trimmed, currentPrompt.content, false);
        }
        onClose();
    };

    const handleMove = async () => {
        if (selectedCategory === currentCategoryId) {
            onClose();
            return;
        }
        // Check for duplicate in target category
        if (isDuplicateTitle(promptTitle, selectedCategory, promptId)) {
            alert("目标分类下已存在同名提示词");
            return;
        }
        await movePrompt(promptId, selectedCategory);
        onClose();
    };

    const handleCopy = async () => {
        const trimmed = copyTitle.trim();
        if (!trimmed) {
            alert("请输入标题");
            return;
        }
        // Check for duplicate in target category
        if (isDuplicateTitle(trimmed, copyCategory)) {
            alert("目标分类下已存在同名提示词");
            return;
        }
        await copyPromptTo(promptId, copyCategory, trimmed);
        onClose();
    };

    const handleDelete = async () => {
        if (confirm("确定要删除这个提示词吗？")) {
            await removePrompt(promptId);
            onClose();
        }
    };

    // Adjust position to keep menu in viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 220),
        y: Math.min(position.y, window.innerHeight - 280),
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[200px] rounded-lg border border-border bg-popover p-1 shadow-lg"
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
                    <button
                        onClick={() => setMode("move")}
                        className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                    >
                        <FolderOpen className="h-4 w-4" />
                        移动到...
                    </button>
                    <button
                        onClick={() => setMode("copy")}
                        className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                    >
                        <Copy className="h-4 w-4" />
                        复制到...
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                        onClick={handleDelete}
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
                        <span className="text-xs font-medium text-muted-foreground">重命名</span>
                        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                            if (e.key === "Escape") onClose();
                        }}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                        autoFocus
                    />
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

            {mode === "move" && (
                <div className="p-2">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">移动到</span>
                        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <select
                        value={selectedCategory ?? ""}
                        onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                    >
                        <option value="">未分类</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 flex justify-end gap-1">
                        <button
                            onClick={onClose}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleMove}
                            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                            移动
                        </button>
                    </div>
                </div>
            )}

            {mode === "copy" && (
                <div className="p-2">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">复制到</span>
                        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={copyTitle}
                        onChange={(e) => setCopyTitle(e.target.value)}
                        placeholder="新标题"
                        className="mb-2 w-full rounded border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                        autoFocus
                    />
                    <select
                        value={copyCategory ?? ""}
                        onChange={(e) => setCopyCategory(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                    >
                        <option value="">未分类</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <div className="mt-2 flex justify-end gap-1">
                        <button
                            onClick={onClose}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleCopy}
                            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                            复制
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

