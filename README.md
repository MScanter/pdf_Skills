# PDF Analysis Skill for Claude Code

专为 Claude Code 设计的标准 Skill，用于提取和分析 PDF 文档。工具负责提取 PDF 文本，Claude Code 负责智能分析。

## 什么是 Skill？

**Skill** 是 Claude Code 的可复用功能模块：
- Claude 会**自动识别**何时需要使用这个 skill（当用户提到 PDF 分析时）
- 不需要手动输入命令触发
- 可以安装到任何项目或全局使用
- 使用标准的 `SKILL.md` 格式定义

## 架构设计

```
┌─────────────────────┐
│  pdf-analyzer.ts    │  →  只提取 PDF 文本
│  (提取工具)          │      - 解析 PDF
└─────────────────────┘      - 缓存机制
                             - 批量处理
           ↓
    extracted/文本文件
           ↓
┌─────────────────────┐
│   Claude Code       │  →  负责智能分析
│   (自动激活 Skill)   │      - 摘要提取
└─────────────────────┘      - 参考文献
                             - 问答
                             - 对比分析
```

**核心理念**：
- ✅ 工具做 Claude Code 做不了的事（PDF 解析）
- ✅ Claude Code 做它擅长的事（文本分析）
- ✅ 不硬编码模型名称，由 Claude Code 自己决定使用什么模型
- ✅ 使用缓存避免重复解析同一个 PDF
- ✅ Skill 自动激活，无需手动触发

## 功能特性

- 📄 **PDF 文本提取** - 解析 PDF 并提取纯文本内容
- 🔄 **智能缓存** - 基于内容 MD5 的缓存机制，避免重复提取
- 📦 **批量处理** - 支持通配符批量处理多个 PDF（并行，最多 3 个同时）
- 💾 **结构化输出** - 提供纯文本、JSON、Markdown 三种格式
- ⚡ **上下文优化** - 提取轻量文本文件，解决 Claude Code 上下文不足问题
- 🤖 **自动激活** - Claude 自动识别 PDF 相关任务并应用此 skill

## 快速开始

### 1. 安装 Skill

**方式 A：本地安装（项目级）**

克隆此仓库到你的项目目录：
```bash
cd your-project
git clone https://github.com/yourusername/pdf-skills .skills/pdf-analysis
cd .skills/pdf-analysis
npm install
```

**方式 B：全局安装**

克隆到 Claude Code 的全局 skills 目录：
```bash
# 克隆到全局 skills 目录
git clone https://github.com/yourusername/pdf-skills ~/claude-skills/pdf-analysis
cd ~/claude-skills/pdf-analysis
npm install
```

**方式 C：通过插件市场（如果已发布）**
```bash
# 在 Claude Code 中运行
/plugin install pdf-analysis@your-marketplace
```

### 2. 使用方式

安装后，**Skill 会自动激活**。当你在 Claude Code 中提到 PDF 相关任务时，Claude 会自动使用这个 skill。

**示例对话**：

```
你: "请帮我分析 papers/research.pdf 这篇论文的主要内容"

Claude Code 会自动：
1. 识别这是 PDF 分析任务
2. 激活 pdf-analysis skill
3. 运行 npm run pdf papers/research.pdf 提取文本
4. 读取 extracted/research/content.txt
5. 分析并回答你的问题
```

```
你: "对比 papers/ 目录下的三篇论文"

Claude Code 会自动：
1. 批量提取：npm run pdf "papers/*.pdf" --batch
2. 读取每个 extracted/*/content.txt
3. 综合对比分析
```

**无需手动命令** - Skill 会在需要时自动工作！

### 3. 验证安装

在 Claude Code 中询问：
```
有哪些 PDF 相关的 skills 可用？
```

或者直接测试：
```
帮我分析一下 test.pdf
```

## 输出文件结构

提取后会生成以下文件：

```
extracted/<pdf名称>/
├── content.txt      # 纯文本内容（Claude 会自动读取分析）
├── extracted.json   # 完整提取结果（含元数据）
└── info.md          # 元数据摘要（页数、字符数、hash 等）
```

## 使用场景

### 场景 1：分析单个 PDF

**你只需要说**：
```
分析 paper.pdf 的主要贡献是什么？
```

**Claude 会自动**：
1. 识别需要 PDF 分析
2. 运行提取工具
3. 读取文本
4. 给出分析结果

### 场景 2：对比多个 PDF

**你只需要说**：
```
对比 papers/ 目录下这三篇论文的研究方法
```

**Claude 会自动**：
1. 批量提取所有 PDF
2. 逐个分析
3. 综合对比

### 场景 3：处理大型 PDF（>100 页）

**Claude 会智能处理**：
- 先查看元数据判断大小
- 如果太大，会建议分段分析
- 自动调整策略避免上下文溢出

### 场景 4：重复分析

**自动使用缓存**：
- 第一次分析会提取文本
- 后续问题直接使用已提取的文本
- 无需重复解析 PDF

## 工具命令（高级）

虽然 Skill 会自动处理，但你也可以手动预提取：

```bash
# 提取单个 PDF
npm run pdf papers/research.pdf

# 批量提取
npm run pdf "papers/*.pdf" --batch

# 指定输出目录
npm run pdf paper.pdf -o results

# 只输出 JSON（不保存文件）
npm run pdf paper.pdf --json
```

## 解决上下文不足问题

**问题**：在 Claude Code 中直接读取多个 PDF 会快速耗尽上下文。

**Skill 的解决方案**（自动两阶段工作流）：

**阶段 1: 自动提取文本**
- Claude 识别需要 PDF 分析
- 自动运行提取工具
- 生成轻量文本文件

**阶段 2: 读取并分析**
- Claude 读取提取的文本文件（而非原 PDF）
- 文本文件占用上下文远小于 PDF
- 可以处理更多文档

**效果对比**：
| 方式 | 文件大小 | 上下文占用 |
|------|---------|-----------|
| 直接读取 PDF | 10MB (50 页) | ~100,000 tokens |
| 读取提取的文本 | 50KB | ~5,000 tokens |
| **减少** | **约 200 倍** | **约 95%** |

## 项目结构

```
pdf-skills/
├── SKILL.md                    # Skill 定义（核心指令，精简版）
├── docs/                       # 详细文档（渐进式披露）
│   ├── reference.md            # API 参考和技术细节
│   ├── examples.md             # 7 种使用场景示例
│   └── troubleshooting.md      # 问题排查指南
├── src/
│   └── pdf-analyzer.ts         # PDF 文本提取工具
├── extracted/                  # 提取结果输出目录（自动创建）
│   ├── README.md
│   └── <pdf-name>/
│       ├── content.txt         # 纯文本
│       ├── extracted.json      # JSON 格式
│       └── info.md             # 元数据
├── .cache/                     # 缓存目录（自动创建）
├── package.json
├── tsconfig.json
└── README.md
```

### 文档组织（渐进式披露）

本项目采用**渐进式披露**策略，优化 Claude Code 的上下文使用：

- **SKILL.md**（90 行）- 核心指令，Claude 始终加载
- **docs/reference.md**（147 行）- 完整 API 参考，需要时查阅
- **docs/examples.md**（372 行）- 详细使用示例，需要时查阅
- **docs/troubleshooting.md**（562 行）- 问题排查，遇到问题时查阅

**优势**：
- 初始 token 开销减少 65%（从 138 行降至 90 行）
- 详细内容按需加载
- 更符合 Claude Code Skills 最佳实践

## SKILL.md 格式

本项目使用标准的 `SKILL.md` 格式：

```markdown
---
name: analyzing-pdfs
description: Extract text from PDF files and analyze academic papers...
allowed-tools: Bash, Read, Glob, Write
version: 2.0.0
---

# PDF Analysis Skill

[指令内容...]
```

**YAML frontmatter 字段**：
- `name`: skill 名称（使用动名词形式，如 `analyzing-pdfs`）
- `description`: 功能描述和使用场景（最多 1024 字符）
- `allowed-tools`: 限制 Claude 可使用的工具（可选）
- `version`: 版本号（可选，便于管理）

## 环境要求

- Node.js >= 18
- Claude Code CLI

**不需要**：
- ❌ Anthropic API Key（分析由 Claude Code 自己完成）
- ❌ 环境变量配置
- ❌ 手动触发命令（Skill 自动激活）

## 技术栈

- **TypeScript** - 类型安全的开发体验
- **pdf-parse** - PDF 文本提取
- **glob** - 文件匹配和批量处理
- **tsx** - TypeScript 直接执行

## 高级功能

### 缓存机制

工具会自动缓存提取结果：
- 基于 PDF 文本内容的 MD5 hash
- 同一个 PDF 重复提取会直接使用缓存
- 缓存位置：`.cache/<hash>/extracted.json`

### 并行批量处理

批量模式下，最多同时处理 3 个 PDF：
```bash
npm run pdf "papers/*.pdf" --batch
```

### 渐进式披露（Progressive Disclosure）

Skill 使用渐进式加载：
- 只有几十个 tokens 的初始开销
- 完整指令仅在需要时加载
- 对 Claude Code 性能影响极小

## 常见问题

### Q: Skill 和 Slash Command 的区别？

A:
- **Slash Command** (`/pdf`)：需要手动输入命令触发
- **Skill**：Claude 自动识别任务并激活，无需手动触发

### Q: 如何知道 Skill 是否已激活？

A: Claude 会在分析时自然使用 skill 的能力。你可以询问"有哪些 PDF 相关的 skills"来验证。

### Q: 这个工具会调用 AI 分析吗？

A: 不会。工具只提取 PDF 文本。所有分析由 Claude Code 自己完成，使用你在 Claude Code 中配置的模型。

### Q: 支持哪些 PDF 格式？

A: 支持大部分标准 PDF 格式。对于扫描版 PDF（纯图片），文本提取效果可能受限，建议先用 OCR 工具处理。

### Q: 提取一个 PDF 需要多长时间？

A: 取决于 PDF 大小：
- 小文件（<10 页）：0.5-1 秒
- 中等文件（10-50 页）：1-3 秒
- 大文件（>50 页）：3-10 秒
- 如果使用缓存：<0.1 秒

### Q: 如何分享这个 Skill？

A: 三种方式：
1. **Git 仓库**：分享仓库链接，其他人克隆使用
2. **插件市场**：发布到 Claude Code 插件市场
3. **直接复制**：将整个文件夹复制到其他项目的 `.skills/` 目录

### Q: 可以自定义 Skill 的行为吗？

A: 可以！编辑 `SKILL.md` 文件：
- 修改 YAML frontmatter 中的 description
- 调整"分析策略"部分的指令
- 添加新的使用场景

## 术语说明

- **Skill**：Claude Code 的可复用功能模块，定义在 `SKILL.md` 文件中，自动激活
- **SKILL.md**：标准的 skill 定义文件，包含 YAML frontmatter 和 Markdown 指令
- **提取工具**：`src/pdf-analyzer.ts`，负责 PDF 解析和文本提取
- **分析**：由 Claude Code 自己完成，工具不做分析
- **渐进式披露**：Skill 仅在需要时加载完整内容，初始开销极小

## 开发和贡献

欢迎提交 Issue 和 Pull Request！

### 本地开发

```bash
# 安装依赖
npm install

# 测试提取
npm run pdf test.pdf

# 开发模式（监听文件变化）
npx tsx watch src/pdf-analyzer.ts papers/test.pdf

# 类型检查
npx tsc --noEmit
```

### 修改 Skill 定义

编辑 `SKILL.md` 来调整 skill 的行为：
1. 修改 YAML frontmatter（name、description）
2. 调整 Markdown 内容中的指令
3. 测试确认 Claude 能正确理解新指令

## License

MIT License

## 相关资源

- [Claude Code 文档](https://github.com/anthropics/claude-code)
- [Anthropic Skills 仓库](https://github.com/anthropics/skills)
- [Skill 创作最佳实践](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [pdf-parse 文档](https://www.npmjs.com/package/pdf-parse)
