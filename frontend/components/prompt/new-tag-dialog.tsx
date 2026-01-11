"use client";

import { useState } from "react";
import { X, Tag } from "lucide-react";
import { usePromptStore } from "@/lib/store";

interface NewTagDialogProps {
    open: boolean;
    onClose: () => void;
}

const colorOptions = [
    { name: "橙色", value: "#F97316" },
    { name: "绿色", value: "#22C55E" },
    { name: "蓝色", value: "#3B82F6" },
    { name: "紫色", value: "#8B5CF6" },
    { name: "粉色", value: "#EC4899" },
    { name: "黄色", value: "#EAB308" },
    { name: "红色", value: "#EF4444" },
    { name: "青色", value: "#06B6D4" },
];

export function NewTagDialog({ open, onClose }: NewTagDialogProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#F97316");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addTag } = usePromptStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await addTag(name.trim(), color);
            setName("");
            setColor("#F97316");
            onClose();
        } catch (error) {
            console.error("Failed to create tag:", error);
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
                        <Tag className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">新建标签</h2>
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
                                标签名称
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="输入标签名称..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                颜色
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setColor(opt.value)}
                                        className={`h-8 w-8 rounded-full transition-all ${color === opt.value
                                                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                                : "hover:scale-110"
                                            }`}
                                        style={{ backgroundColor: opt.value }}
                                        title={opt.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                预览
                            </label>
                            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-white" style={{ backgroundColor: color }}>
                                <span>{name || "标签名称"}</span>
                            </div>
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
