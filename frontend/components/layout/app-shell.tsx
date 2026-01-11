"use client";

import { ActivityBar } from "./activity-bar";
import { Sidebar } from "./sidebar";
import { EditorGroup } from "./editor-group";
import { StatusBar } from "./status-bar";
import { useState } from "react";

export type ActivityType = "explorer" | "tags" | "test" | "settings";

export function AppShell() {
    const [activeActivity, setActiveActivity] = useState<ActivityType>("explorer");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Activity Bar - 48px fixed width */}
                <ActivityBar
                    activeActivity={activeActivity}
                    onActivityChange={setActiveActivity}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Sidebar - collapsible */}
                {sidebarOpen && (
                    <>
                        <Sidebar
                            activeActivity={activeActivity}
                            width={sidebarWidth}
                            onWidthChange={setSidebarWidth}
                        />

                        {/* Draggable divider */}
                        <div
                            className={`w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors ${isDragging ? "bg-primary" : ""}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                                const startX = e.clientX;
                                const startWidth = sidebarWidth;

                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                    const deltaX = moveEvent.clientX - startX;
                                    const newWidth = Math.max(180, Math.min(400, startWidth + deltaX));
                                    setSidebarWidth(newWidth);
                                };

                                const handleMouseUp = () => {
                                    setIsDragging(false);
                                    document.removeEventListener("mousemove", handleMouseMove);
                                    document.removeEventListener("mouseup", handleMouseUp);
                                };

                                document.addEventListener("mousemove", handleMouseMove);
                                document.addEventListener("mouseup", handleMouseUp);
                            }}
                        />
                    </>
                )}

                {/* Editor Group - takes remaining space */}
                <EditorGroup />
            </div>

            {/* Status Bar - 22px fixed height */}
            <StatusBar />
        </div>
    );
}
