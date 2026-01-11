"use client";

import { RotateCcw, Clock, GitCompare, X, BookmarkPlus, Star } from "lucide-react";
import { usePromptStore, useActivePrompt } from "@/lib/store";
import { useState } from "react";

interface VersionPanelProps {
    content: string;
    onCompare?: (versionContent: string) => void;
}

export function VersionPanel({ content, onCompare }: VersionPanelProps) {
    const [showNameInput, setShowNameInput] = useState(false);
    const [versionName, setVersionName] = useState("");
    const [showOnlyStarred, setShowOnlyStarred] = useState(false);

    const {
        versions,
        activePromptId,
        showVersionPanel,
        toggleVersionPanel,
        createVersionSnapshot,
        restoreVersion,
        setCompareVersions,
        compareVersionIds,
        toggleVersionStar,
    } = usePromptStore();

    const activePrompt = useActivePrompt();

    if (!showVersionPanel || !activePrompt) return null;

    // Filter versions by starred if needed
    const displayedVersions = showOnlyStarred
        ? versions.filter(v => v.is_starred === 1)
        : versions;

    const starredCount = versions.filter(v => v.is_starred === 1).length;

    const handleCreateVersion = async () => {
        if (!activePromptId) return;
        await createVersionSnapshot(activePromptId, content, versionName || undefined);
        setVersionName("");
        setShowNameInput(false);
    };

    const handleRestore = async (versionId: number) => {
        if (confirm("确定要恢复到此版本吗？当前内容将被保存为备份。")) {
            await restoreVersion(versionId);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex w-64 flex-col border-l border-border bg-sidebar">
            {/* Header */}
            <div className="flex h-9 items-center justify-between border-b border-border px-3">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sidebar-foreground/60" />
                    <span className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
                        版本历史
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                        className={`rounded p-1 transition-colors ${showOnlyStarred
                            ? "bg-amber-500/20 text-amber-500"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }`}
                        title={showOnlyStarred ? "显示全部" : `只看星标 (${starredCount})`}
                    >
                        <Star className="h-4 w-4" fill={showOnlyStarred ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={toggleVersionPanel}
                        className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Create version */}
            <div className="border-b border-border p-2">
                {showNameInput ? (
                    <div className="flex gap-1">
                        <input
                            type="text"
                            value={versionName}
                            onChange={(e) => setVersionName(e.target.value)}
                            placeholder="版本名称..."
                            className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
                            autoFocus
                        />
                        <button
                            onClick={handleCreateVersion}
                            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                            创建
                        </button>
                        <button
                            onClick={() => setShowNameInput(false)}
                            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                            取消
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowNameInput(true)}
                        className="flex w-full items-center justify-center gap-1 rounded bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>创建版本快照</span>
                    </button>
                )}
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto p-2">
                {displayedVersions.length === 0 ? (
                    <div className="text-center text-xs text-sidebar-foreground/60 py-4">
                        {showOnlyStarred ? "暂无星标版本" : "暂无版本记录"}
                        <br />
                        <span className="text-[10px]">
                            {showOnlyStarred ? "点击 ⭐ 标记重要版本" : "保存时会自动创建版本"}
                        </span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {displayedVersions.map((version, index) => (
                            <div
                                key={version.id}
                                className={`rounded border p-2 text-xs transition-colors ${compareVersionIds.includes(version.id)
                                    ? "border-primary bg-primary/10"
                                    : "border-transparent hover:bg-sidebar-accent"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => toggleVersionStar(version.id)}
                                            className={`p-0.5 rounded transition-colors ${version.is_starred
                                                    ? "text-amber-500"
                                                    : "text-sidebar-foreground/30 hover:text-amber-400"
                                                }`}
                                            title={version.is_starred ? "取消星标" : "添加星标"}
                                        >
                                            <Star className="h-3.5 w-3.5" fill={version.is_starred ? "currentColor" : "none"} />
                                        </button>
                                        <span className="font-medium text-sidebar-foreground">
                                            {version.version_name || `v${versions.length - versions.indexOf(version)}`}
                                        </span>
                                    </div>
                                    <span className="text-sidebar-foreground/40">
                                        {formatDate(version.created_at)}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-1">
                                    <button
                                        onClick={() => handleRestore(version.id)}
                                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        title="恢复到此版本"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        恢复
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onCompare) {
                                                onCompare(version.content);
                                            }
                                            setCompareVersions([version.id, null]);
                                        }}
                                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        title="与当前对比"
                                    >
                                        <GitCompare className="h-3 w-3" />
                                        对比
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Current version info */}
            <div className="border-t border-border p-2 text-center">
                <span className="text-[10px] text-sidebar-foreground/40">
                    共 {versions.length} 个版本
                </span>
            </div>
        </div>
    );
}
