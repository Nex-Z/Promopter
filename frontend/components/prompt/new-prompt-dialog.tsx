"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { usePromptStore } from "@/lib/store";

interface NewPromptDialogProps {
    open: boolean;
    onClose: () => void;
}

export function NewPromptDialog({ open, onClose }: NewPromptDialogProps) {
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { categories, prompts, createNewPrompt } = usePromptStore();

    // Check if title already exists in the same category
    const isDuplicateTitle = (newTitle: string, catId: number | null) => {
        return prompts.some(
            (p) => p.title.toLowerCase() === newTitle.toLowerCase() && p.category_id === catId
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        // Validate unique title within category
        if (isDuplicateTitle(trimmedTitle, categoryId)) {
            setError("该分类下已存在同名提示词");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            await createNewPrompt(trimmedTitle, categoryId ?? undefined);
            setTitle("");
            setCategoryId(null);
            onClose();
        } catch (error) {
            console.error("Failed to create prompt:", error);
            setError("创建失败，请重试");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">新建提示词</h2>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Title input */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                标题
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setError(null);
                                }}
                                placeholder="输入提示词标题..."
                                className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${error
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-input focus:border-primary focus:ring-primary"
                                    }`}
                                autoFocus
                            />
                            {error && (
                                <p className="mt-1 text-xs text-red-500">{error}</p>
                            )}
                        </div>

                        {/* Category select */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                分类 <span className="text-muted-foreground font-normal">(可选)</span>
                            </label>
                            <select
                                value={categoryId ?? ""}
                                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">无分类</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
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
                            disabled={!title.trim() || isSubmitting}
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

// Trigger button for opening the dialog
export function NewPromptButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="新建提示词"
        >
            <Plus className="h-4 w-4" />
        </button>
    );
}
