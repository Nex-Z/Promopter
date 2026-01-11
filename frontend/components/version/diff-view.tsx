"use client";

import { diffLines, Change } from "diff";
import { X } from "lucide-react";

interface DiffViewProps {
    oldContent: string;
    newContent: string;
    oldLabel?: string;
    newLabel?: string;
    onClose?: () => void;
}

export function DiffView({
    oldContent,
    newContent,
    oldLabel = "旧版本",
    newLabel = "当前版本",
    onClose,
}: DiffViewProps) {
    const differences = diffLines(oldContent, newContent);

    const getLineClass = (change: Change) => {
        if (change.added) {
            return "bg-green-500/20 text-green-700 dark:text-green-300";
        }
        if (change.removed) {
            return "bg-red-500/20 text-red-700 dark:text-red-300";
        }
        return "text-muted-foreground";
    };

    const getLinePrefix = (change: Change) => {
        if (change.added) return "+";
        if (change.removed) return "-";
        return " ";
    };

    const stats = differences.reduce(
        (acc, change) => {
            const lines = change.value.split("\n").filter(Boolean).length;
            if (change.added) acc.added += lines;
            else if (change.removed) acc.removed += lines;
            return acc;
        },
        { added: 0, removed: 0 }
    );

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Header */}
            <div className="flex h-10 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">版本对比</span>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-red-600 dark:text-red-400">
                            -{stats.removed} 行
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                            +{stats.added} 行
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Labels */}
            <div className="flex h-8 items-center border-b border-border text-xs">
                <div className="flex-1 border-r border-border px-4 text-red-600 dark:text-red-400">
                    {oldLabel}
                </div>
                <div className="flex-1 px-4 text-green-600 dark:text-green-400">
                    {newLabel}
                </div>
            </div>

            {/* Diff content */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-full font-mono text-sm">
                    {differences.map((change, index) => {
                        const lines = change.value.split("\n");
                        // Remove last empty line from split
                        if (lines[lines.length - 1] === "") {
                            lines.pop();
                        }

                        return lines.map((line, lineIndex) => (
                            <div
                                key={`${index}-${lineIndex}`}
                                className={`flex ${getLineClass(change)}`}
                            >
                                <span className="w-8 flex-shrink-0 select-none border-r border-border px-2 text-right text-muted-foreground/50">
                                    {getLinePrefix(change)}
                                </span>
                                <pre className="flex-1 px-4 py-0.5 whitespace-pre-wrap break-all">
                                    {line || " "}
                                </pre>
                            </div>
                        ));
                    })}
                </div>
            </div>
        </div>
    );
}
