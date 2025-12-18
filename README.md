# PDF Skills for Claude Code

专为 Claude Code 设计的学术 PDF 文献分析工具，支持智能提取摘要、参考文献、表格图表，并可以基于文献内容回答问题。

## 功能特性

- ✅ **提取文献摘要** - 自动识别标题、摘要、关键发现、研究方法和结论
- ✅ **整理参考文献** - 解析并结构化所有引用，包含作者、年份、标题信息
- ✅ **提取表格图表** - 识别文中的数据表格和图表，提供内容分析
- ✅ **智能问答** - 基于文献内容回答问题，标注置信度和支持证据
- ✅ **批量分析** - 一键执行所有分析，生成完整报告

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 Anthropic API Key
# ANTHROPIC_AUTH_TOKEN=your-api-key-here
```

### 3. 使用方式

#### 方式 A: 在 Claude Code 中使用 `/pdf` 命令

在 Claude Code 中，直接使用 `/pdf` slash command:

```
/pdf 请分析 papers/research.pdf 的主要内容
/pdf 这篇论文引用了哪些文献？
/pdf 论文中的实验结果是什么？
```

Claude Code 会自动调用分析工具并展示结果。

#### 方式 B: 直接使用命令行

```bash
# 提取摘要和关键信息
npm run pdf papers/research.pdf summary

# 提取参考文献
npm run pdf papers/research.pdf citations

# 提取表格和图表
npm run pdf papers/research.pdf tables

# 回答特定问题
npm run pdf papers/research.pdf question "这篇论文的主要贡献是什么？"

# 执行全面分析
npm run pdf papers/research.pdf all
```

## 详细功能说明

### 1. 摘要分析 (summary)

提取论文的核心信息：

```bash
npm run pdf paper.pdf summary
```

输出包含：
- 论文标题
- 完整摘要
- 5-10 个关键发现
- 研究方法描述
- 主要结论
- 核心关键词

### 2. 参考文献提取 (citations)

解析并整理所有引用：

```bash
npm run pdf paper.pdf citations
```

输出包含：
- 完整引用文本
- 作者列表
- 发表年份
- 论文/书籍标题

### 3. 表格图表提取 (tables)

识别和分析文中的数据可视化：

```bash
npm run pdf paper.pdf tables
```

输出包含：
- 类型（表格/图表）
- 标题说明
- 页码位置
- 内容描述
- 简要分析

### 4. 智能问答 (question)

基于文献回答特定问题：

```bash
npm run pdf paper.pdf question "研究中使用了哪些数据集？"
```

输出包含：
- 详细答案
- 置信度评估（high/medium/low）
- 支持证据列表

### 5. 全面分析 (all)

一次性执行所有分析：

```bash
npm run pdf paper.pdf all
```

## 项目结构

```
pdf_Skills/
├── .claude/
│   └── commands/
│       └── pdf.md              # /pdf slash command 配置
├── src/
│   └── pdf-analyzer.ts         # 核心分析逻辑
├── package.json                # 项目配置和依赖
├── tsconfig.json               # TypeScript 配置
├── .env.example                # 环境变量模板
└── README.md                   # 使用文档
```

## 环境要求

- Node.js >= 18
- Anthropic API Key
- Claude Code CLI（可选，用于 slash command）

## 技术栈

- **TypeScript** - 类型安全的开发体验
- **@anthropic-ai/sdk** - Claude API 调用
- **pdf-parse** - PDF 文本提取
- **tsx** - TypeScript 直接执行

## 高级配置

### 自定义 API 端点

如果使用自定义 API 端点，在 `.env` 中添加：

```bash
ANTHROPIC_BASE_URL=https://your-custom-endpoint.com
```

### 模型选择

默认使用 `claude-sonnet-4-5-20250929`。如需更改，编辑 `src/pdf-analyzer.ts:59`。

可选模型：
- `claude-opus-4-5-20251101` - 更强大的分析能力（成本更高）
- `claude-sonnet-4-5-20250929` - 平衡性能和成本（推荐）

### 处理大型 PDF

对于超大型 PDF（>100 页），建议：

1. 先提取特定部分：
```bash
# 只分析摘要部分
npm run pdf large-paper.pdf summary
```

2. 分页处理（需要自定义实现）

## 常见问题

### Q: 为什么需要 ANTHROPIC_AUTH_TOKEN？

A: 本工具使用 Claude API 进行智能分析，需要有效的 API Key。可以在 [Anthropic Console](https://console.anthropic.com/) 获取。

### Q: 支持哪些 PDF 格式？

A: 支持大部分标准 PDF 格式。对于扫描版 PDF，文本提取效果可能受限。

### Q: 分析一篇论文需要多长时间？

A: 取决于 PDF 大小和分析类型：
- 摘要分析：10-30 秒
- 参考文献：20-60 秒
- 全面分析：1-3 分钟

### Q: 如何在其他项目中使用这个 skill？

A: 两种方式：
1. 将整个项目复制到新项目的 `.claude/skills/pdf/` 目录
2. 使用 MCP Server 方式（需要额外配置）

## 开发和贡献

欢迎提交 Issue 和 Pull Request！

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npx tsx watch src/pdf-analyzer.ts papers/test.pdf summary

# 类型检查
npx tsc --noEmit
```

## License

MIT License

## 相关资源

- [Claude Code 文档](https://github.com/anthropics/claude-code)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)
