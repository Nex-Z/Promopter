"use client";

import { Check, GitBranch, FileText } from "lucide-react";
import { usePromptStore, useActivePrompt } from "@/lib/store";

export function StatusBar() {
    const { prompts } = usePromptStore();
    const activePrompt = useActivePrompt();

    const charCount = activePrompt?.content.length ?? 0;
    const wordCount = activePrompt?.content.trim().split(/\s+/).filter(Boolean).length ?? 0;

    return (
        <div className="flex h-[22px] items-center justify-between border-t border-border bg-primary px-2 text-[11px] text-primary-foreground">
            {/* Left section */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>已保存</span>
                </div>
                <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    <span>v1.0.0</span>
                </div>
                <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{prompts.length} 个提示词</span>
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
                {activePrompt && (
                    <>
                        <span>{charCount.toLocaleString()} 字符</span>
                        <span>{wordCount} 词</span>
                    </>
                )}
                <span>UTF-8</span>
                <span>Markdown</span>
            </div>
        </div>
    );
}
