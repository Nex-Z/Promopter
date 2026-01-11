"use client";

import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { usePromptStore } from "@/lib/store";

interface NewCategoryDialogProps {
    open: boolean;
    onClose: () => void;
}

export function NewCategoryDialog({ open, onClose }: NewCategoryDialogProps) {
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { categories, addCategory } = usePromptStore();

    // Check for duplicate category name
    const isDuplicateName = (n: string) => {
        return categories.some(
            (cat) => cat.name.toLowerCase() === n.toLowerCase()
        );
    };

    // Reserved names that cannot be used
    const isReservedName = (n: string) => {
        return ["未分类", "uncategorized"].includes(n.toLowerCase());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        // Validate name
        if (isReservedName(trimmed)) {
            setError('"未分类" 是保留名称，请使用其他名称');
            return;
        }
        if (isDuplicateName(trimmed)) {
            setError("该分类名称已存在");
            return;
        }

        setIsSubmitting(true);
        setError("");
        try {
            await addCategory(trimmed, parentId);
            setName("");
            setParentId(null);
            onClose();
        } catch (error) {
            console.error("Failed to create category:", error);
            setError("创建失败");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FolderPlus className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">新建分类</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                分类名称
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError("");
                                }}
                                placeholder="输入分类名称..."
                                className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${error
                                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                                        : "border-input focus:border-primary focus:ring-primary"
                                    }`}
                                autoFocus
                            />
                            {error && (
                                <p className="mt-1 text-xs text-destructive">{error}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                父分类（可选）
                            </label>
                            <select
                                value={parentId ?? ""}
                                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">无（顶级分类）</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? "创建中..." : "创建"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
