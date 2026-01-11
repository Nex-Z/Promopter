# Prompter - 提示词管理器

<p align="center">
  <strong>一款专为 AI 提示词设计的本地桌面管理工具</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri" alt="Tauri 2.0">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/SQLite-Local-003B57?logo=sqlite" alt="SQLite">
</p>

---

## ✨ 功能特性

### 📝 Markdown 编辑器 (CodeMirror 6)
- **语法高亮** - Markdown 语法实时着色
- **实时预览** - 支持分屏、编辑、预览三种模式
- **斜杠命令** - 输入 `/` 调出命令面板，快速插入 60+ 种语法模板
- **自动配对** - 括号、引号、Markdown 符号智能补全
- **GitHub 风格** - 代码高亮、GFM 表格、任务列表、Alerts
- **数学公式** - LaTeX 语法支持 (KaTeX)
- **Emoji** - `:rocket:` 短代码支持

### 📂 分类管理
- 提示词分类与标签系统
- 右键菜单快捷操作 (重命名/移动/删除)
- 智能搜索与过滤

### 📜 版本控制
- 自动保存版本快照
- 版本历史浏览
- Diff 对比视图

### 🎨 主题系统
- 深色/浅色模式切换
- Stone + Orange 暖色调设计
- VSCode 风格布局

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm
- Rust (用于 Tauri)

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/prompter.git
cd prompter

# 安装依赖
cd frontend && pnpm install

# 开发模式运行
cd .. && pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

---

## 🏗️ 项目结构

```
prompter/
├── frontend/                 # Next.js 前端
│   ├── app/                  # App Router 页面
│   ├── components/           # React 组件
│   │   ├── editor/           # Markdown 编辑器
│   │   ├── layout/           # 布局组件
│   │   ├── prompt/           # 提示词相关
│   │   └── version/          # 版本管理
│   └── lib/                  # 工具库
│       ├── db.ts             # SQLite 数据库 API
│       └── store.ts          # Zustand 状态管理
├── src-tauri/                # Tauri 后端 (Rust)
│   ├── src/                  # Rust 源码
│   └── capabilities/         # 权限配置
└── docs/                     # 项目文档
```

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **桌面框架** | Tauri 2.0 |
| **前端框架** | Next.js 16 + React 19 |
| **状态管理** | Zustand |
| **样式** | Tailwind CSS |
| **数据库** | SQLite (tauri-plugin-sql) |
| **代码编辑器** | CodeMirror 6 |
| **Markdown** | react-markdown + rehype/remark 插件 |

---

## 📋 开发进度

- [x] Phase 1: 基础框架 (数据库、布局、主题)
- [x] Phase 2: 核心功能 (CRUD、编辑器、分类)
- [x] Phase 3: 版本管理 (快照、历史、Diff)
- [x] Markdown 兼容性增强 + CodeMirror 编辑器
- [ ] Phase 4: 测试功能 (API 配置、提示词测试)

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
