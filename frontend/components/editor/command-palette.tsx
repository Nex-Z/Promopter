"use client";

import { useState, useEffect, useRef } from "react";

// Command category and item types
interface CommandItem {
    label: string;
    detail: string;
    template: string;
    keywords?: string[];
}

interface CommandCategory {
    name: string;
    icon: string;
    items: CommandItem[];
}

// Command definitions organized by category
const commandCategories: CommandCategory[] = [
    {
        name: "标题",
        icon: "📝",
        items: [
            { label: "h1", detail: "一级标题", template: "# 标题", keywords: ["title", "heading", "biaoti"] },
            { label: "h2", detail: "二级标题", template: "## 标题" },
            { label: "h3", detail: "三级标题", template: "### 标题" },
            { label: "h4", detail: "四级标题", template: "#### 标题" },
            { label: "h5", detail: "五级标题", template: "##### 标题" },
            { label: "h6", detail: "六级标题", template: "###### 标题" },
        ],
    },
    {
        name: "格式",
        icon: "✨",
        items: [
            { label: "bold", detail: "粗体", template: "**粗体文本**", keywords: ["cuti", "strong", "加粗"] },
            { label: "italic", detail: "斜体", template: "*斜体文本*", keywords: ["xieti", "em", "倾斜"] },
            { label: "bolditalic", detail: "粗斜体", template: "***粗斜体文本***" },
            { label: "strike", detail: "删除线", template: "~~删除线文本~~", keywords: ["shanchuxian", "del"] },
            { label: "highlight", detail: "高亮", template: "<mark>高亮文本</mark>", keywords: ["mark"] },
            { label: "sub", detail: "下标", template: "<sub>下标</sub>" },
            { label: "sup", detail: "上标", template: "<sup>上标</sup>" },
            { label: "kbd", detail: "键盘按键", template: "<kbd>Ctrl</kbd> + <kbd>C</kbd>" },
        ],
    },
    {
        name: "代码",
        icon: "💻",
        items: [
            { label: "code", detail: "行内代码", template: "`代码`", keywords: ["daima"] },
            { label: "codeblock", detail: "代码块", template: "```\n代码\n```" },
            { label: "js", detail: "JavaScript", template: "```javascript\nconst x = 1;\n```" },
            { label: "ts", detail: "TypeScript", template: "```typescript\nconst x: number = 1;\n```" },
            { label: "py", detail: "Python", template: "```python\ndef fn():\n    pass\n```" },
            { label: "bash", detail: "Bash", template: "```bash\necho 'hello'\n```" },
            { label: "sql", detail: "SQL", template: "```sql\nSELECT * FROM t;\n```" },
            { label: "json", detail: "JSON", template: "```json\n{\"k\": \"v\"}\n```" },
            { label: "diff", detail: "Diff", template: "```diff\n- old\n+ new\n```" },
        ],
    },
    {
        name: "媒体",
        icon: "🔗",
        items: [
            { label: "link", detail: "链接", template: "[文本](url)", keywords: ["lianjie"] },
            { label: "image", detail: "图片", template: "![alt](url)", keywords: ["tupian"] },
            { label: "video", detail: "视频", template: "<video src=\"\" controls></video>" },
            { label: "audio", detail: "音频", template: "<audio src=\"\" controls></audio>" },
            { label: "iframe", detail: "嵌入", template: "<iframe src=\"\"></iframe>" },
        ],
    },
    {
        name: "引用",
        icon: "💬",
        items: [
            { label: "quote", detail: "引用", template: "> 引用" },
            { label: "note", detail: "📘 提示", template: "> [!NOTE]\n> 内容" },
            { label: "tip", detail: "💡 技巧", template: "> [!TIP]\n> 内容" },
            { label: "important", detail: "📢 重要", template: "> [!IMPORTANT]\n> 内容" },
            { label: "warning", detail: "⚠️ 警告", template: "> [!WARNING]\n> 内容" },
            { label: "caution", detail: "🚨 危险", template: "> [!CAUTION]\n> 内容" },
        ],
    },
    {
        name: "列表",
        icon: "📋",
        items: [
            { label: "ul", detail: "无序列表", template: "- 项目1\n- 项目2\n- 项目3" },
            { label: "ol", detail: "有序列表", template: "1. 项目1\n2. 项目2\n3. 项目3" },
            { label: "task", detail: "任务列表", template: "- [ ] 待办\n- [x] 完成" },
            { label: "nested", detail: "嵌套列表", template: "- 一级\n  - 二级\n    - 三级" },
        ],
    },
    {
        name: "表格",
        icon: "📊",
        items: [
            { label: "table", detail: "3列表格", template: "| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |" },
            { label: "table2", detail: "2列表格", template: "| A | B |\n|---|---|\n| 1 | 2 |" },
            { label: "table4", detail: "4列表格", template: "| A | B | C | D |\n|---|---|---|---|\n| 1 | 2 | 3 | 4 |" },
        ],
    },
    {
        name: "数学",
        icon: "🔢",
        items: [
            { label: "math", detail: "公式块", template: "$$\nE = mc^2\n$$" },
            { label: "mathinline", detail: "行内公式", template: "$x^2$" },
            { label: "fraction", detail: "分数", template: "$\\frac{a}{b}$" },
            { label: "sqrt", detail: "根号", template: "$\\sqrt{x}$" },
            { label: "sum", detail: "求和", template: "$\\sum_{i=1}^{n} x_i$" },
        ],
    },
    {
        name: "特殊",
        icon: "🧩",
        items: [
            { label: "hr", detail: "分隔线", template: "\n---\n" },
            { label: "br", detail: "换行", template: "<br>" },
            { label: "details", detail: "折叠", template: "<details>\n<summary>标题</summary>\n\n内容\n\n</details>" },
            { label: "footnote", detail: "脚注", template: "文本[^1]\n\n[^1]: 注释" },
            { label: "center", detail: "居中", template: "<div align=\"center\">\n\n内容\n\n</div>" },
        ],
    },
    {
        name: "表情",
        icon: "😀",
        items: [
            { label: "emoji", detail: "表情集", template: "😀 🎉 🚀 ✅ ❌ ⭐ 💡 🔥" },
            { label: "check", detail: "✅", template: "✅" },
            { label: "cross", detail: "❌", template: "❌" },
            { label: "star", detail: "⭐", template: "⭐" },
            { label: "rocket", detail: "🚀", template: "🚀" },
        ],
    },
    {
        name: "模板",
        icon: "🤖",
        items: [
            { label: "prompt", detail: "提示词", template: "## 角色\n\n你是...\n\n## 任务\n\n请...\n\n## 输入\n\n{{input}}" },
            { label: "system", detail: "System", template: "You are a helpful assistant.\n\n## Instructions\n\n1. ..." },
            { label: "variable", detail: "变量", template: "{{变量}}" },
        ],
    },
];

interface CommandPaletteProps {
    visible: boolean;
    position: { x: number; y: number };
    searchText: string;
    onSelect: (template: string) => void;
    onClose: () => void;
}

export function CommandPalette({ visible, position, searchText, onSelect, onClose }: CommandPaletteProps) {
    const [selectedCatIndex, setSelectedCatIndex] = useState(0);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [focusOnItems, setFocusOnItems] = useState(false); // false = focus on categories, true = focus on items
    const menuRef = useRef<HTMLDivElement>(null);
    const catListRef = useRef<HTMLDivElement>(null);
    const itemListRef = useRef<HTMLDivElement>(null);

    // Filter categories based on search
    const filteredCategories = searchText
        ? commandCategories
            .map(cat => ({
                ...cat,
                items: cat.items.filter(item =>
                    item.label.includes(searchText) ||
                    item.detail.includes(searchText) ||
                    item.keywords?.some(k => k.includes(searchText))
                ),
            }))
            .filter(cat => cat.items.length > 0)
        : commandCategories;

    // Reset state when palette opens
    useEffect(() => {
        if (visible && filteredCategories.length > 0) {
            setSelectedCatIndex(0);
            setSelectedItemIndex(0);
            setFocusOnItems(false); // Start with focus on categories
        }
    }, [visible]);

    // Update when searching - reset to first category
    useEffect(() => {
        if (visible && filteredCategories.length > 0) {
            setSelectedCatIndex(0);
            setSelectedItemIndex(0);
        }
    }, [searchText]);

    // Auto-scroll selected category into view
    useEffect(() => {
        if (!visible || !catListRef.current) return;
        const selectedEl = catListRef.current.querySelector('[data-selected="true"]');
        selectedEl?.scrollIntoView({ block: "nearest" });
    }, [selectedCatIndex, visible]);

    // Auto-scroll selected item into view
    useEffect(() => {
        if (!visible || !itemListRef.current) return;
        const selectedEl = itemListRef.current.querySelector('[data-selected="true"]');
        selectedEl?.scrollIntoView({ block: "nearest" });
    }, [selectedItemIndex, visible]);

    // Keyboard navigation - capture phase to intercept before editor
    useEffect(() => {
        if (!visible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Intercept navigation keys
            if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (e.key === "Escape") {
                onClose();
                return;
            }

            const currentCat = filteredCategories[selectedCatIndex];

            if (e.key === "ArrowDown") {
                if (focusOnItems && currentCat) {
                    // Navigate items
                    setSelectedItemIndex(prev => Math.min(prev + 1, currentCat.items.length - 1));
                } else {
                    // Navigate categories
                    const newIdx = Math.min(selectedCatIndex + 1, filteredCategories.length - 1);
                    setSelectedCatIndex(newIdx);
                    setSelectedItemIndex(0); // Reset item selection
                }
            } else if (e.key === "ArrowUp") {
                if (focusOnItems && currentCat) {
                    // Navigate items
                    setSelectedItemIndex(prev => Math.max(prev - 1, 0));
                } else {
                    // Navigate categories
                    const newIdx = Math.max(selectedCatIndex - 1, 0);
                    setSelectedCatIndex(newIdx);
                    setSelectedItemIndex(0); // Reset item selection
                }
            } else if (e.key === "ArrowRight") {
                // Move focus to items
                setFocusOnItems(true);
                setSelectedItemIndex(0);
            } else if (e.key === "ArrowLeft") {
                // Move focus back to categories
                setFocusOnItems(false);
            } else if (e.key === "Enter") {
                if (focusOnItems && currentCat && currentCat.items[selectedItemIndex]) {
                    // Select item
                    onSelect(currentCat.items[selectedItemIndex].template);
                } else {
                    // Enter from category side = move to items
                    setFocusOnItems(true);
                    setSelectedItemIndex(0);
                }
            }
        };

        // Use capture phase to intercept events before they reach the editor
        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [visible, focusOnItems, selectedCatIndex, selectedItemIndex, filteredCategories, onSelect, onClose]);

    // Close on outside click
    useEffect(() => {
        if (!visible) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [visible, onClose]);

    if (!visible || filteredCategories.length === 0) return null;

    // Calculate position: show above if near bottom
    const menuHeight = 320;
    const adjustedY = position.y + menuHeight > window.innerHeight
        ? Math.max(position.y - menuHeight - 30, 10)
        : position.y;

    const adjustedX = Math.min(position.x, window.innerWidth - 440);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 flex rounded-lg border border-border bg-popover shadow-xl"
            style={{ left: adjustedX, top: adjustedY, maxHeight: menuHeight }}
        >
            {/* Left: Categories */}
            <div ref={catListRef} className={`w-[140px] border-r overflow-y-auto py-1 ${!focusOnItems ? "border-primary/50" : "border-border"}`}>
                {filteredCategories.map((cat, idx) => {
                    const isSelected = idx === selectedCatIndex;
                    const isHighlighted = isSelected && !focusOnItems;
                    return (
                        <button
                            key={cat.name}
                            data-selected={isSelected}
                            onMouseEnter={() => {
                                setSelectedCatIndex(idx);
                                setSelectedItemIndex(0);
                            }}
                            onClick={() => {
                                setSelectedCatIndex(idx);
                                setSelectedItemIndex(0);
                                setFocusOnItems(true);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${isHighlighted
                                    ? "bg-primary/20 text-accent-foreground"
                                    : isSelected
                                        ? "bg-accent text-accent-foreground"
                                        : "text-popover-foreground hover:bg-accent/50"
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span className="truncate">{cat.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{cat.items.length}</span>
                        </button>
                    );
                })}
            </div>

            {/* Right: Items */}
            <div ref={itemListRef} className={`w-[280px] overflow-y-auto py-1 ${focusOnItems ? "border-l border-primary/50" : ""}`}>
                {filteredCategories[selectedCatIndex]?.items.map((item, idx) => {
                    const isHighlighted = idx === selectedItemIndex && focusOnItems;
                    return (
                        <button
                            key={item.label}
                            data-selected={idx === selectedItemIndex}
                            onClick={() => onSelect(item.template)}
                            onMouseEnter={() => {
                                setSelectedItemIndex(idx);
                                setFocusOnItems(true);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${isHighlighted
                                    ? "bg-primary/20 text-accent-foreground"
                                    : idx === selectedItemIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "text-popover-foreground hover:bg-accent/50"
                                }`}
                        >
                            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">/{item.label}</code>
                            <span className="truncate">{item.detail}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { commandCategories };
