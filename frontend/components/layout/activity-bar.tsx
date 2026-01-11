"use client";

import {
    FolderOpen,
    Tags,
    FlaskConical,
    Settings,
    PanelLeftClose,
    PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityType } from "./app-shell";

interface ActivityBarProps {
    activeActivity: ActivityType;
    onActivityChange: (activity: ActivityType) => void;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const activities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
    { id: "explorer", icon: FolderOpen, label: "资源管理器" },
    { id: "tags", icon: Tags, label: "标签" },
    { id: "test", icon: FlaskConical, label: "测试" },
    { id: "settings", icon: Settings, label: "设置" },
];

export function ActivityBar({
    activeActivity,
    onActivityChange,
    sidebarOpen,
    onToggleSidebar,
}: ActivityBarProps) {
    return (
        <div className="flex w-12 flex-col items-center border-r border-border bg-sidebar py-2">
            {/* Activity icons */}
            <div className="flex flex-1 flex-col items-center gap-1">
                {activities.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onActivityChange(id)}
                        className={cn(
                            "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            activeActivity === id
                                ? "text-primary before:absolute before:left-0 before:top-1/2 before:h-6 before:-translate-y-1/2 before:w-0.5 before:rounded-r before:bg-primary"
                                : "text-sidebar-foreground/60"
                        )}
                        title={label}
                    >
                        <Icon className="h-5 w-5" />
                    </button>
                ))}
            </div>

            {/* Toggle sidebar button at bottom */}
            <button
                onClick={onToggleSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title={sidebarOpen ? "折叠侧边栏" : "展开侧边栏"}
            >
                {sidebarOpen ? (
                    <PanelLeftClose className="h-5 w-5" />
                ) : (
                    <PanelLeft className="h-5 w-5" />
                )}
            </button>
        </div>
    );
}
