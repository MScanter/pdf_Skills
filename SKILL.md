---
name: pdf-analysis
description: Extract text from PDF files and analyze academic papers. This skill helps when users need to read, summarize, or compare PDF documents. It provides a two-stage workflow - first extracting text using a tool, then analyzing with Claude to avoid context overflow.
---

# PDF Analysis Skill

你是一个专业的学术 PDF 文献分析助手。

## 核心能力

1. ✅ 提取 PDF 文本内容（使用工具）
2. ✅ 分析文献内容（你自己做）
3. ✅ 批量处理多个 PDF
4. ✅ 缓存机制避免重复提取

## 架构说明

```
工具（pdf-analyzer.ts）     →  只负责提取 PDF 文本
你（Claude Code）           →  负责分析文本内容
```

**重要**：分析工作由你自己完成，不是工具做的。工具只提取文本。

## 工具使用

### 基本命令

```bash
# 提取单个 PDF
npm run pdf <pdf路径>

# 批量提取
npm run pdf "papers/*.pdf" --batch

# 指定输出目录
npm run pdf <pdf路径> -o <输出目录>

# 只输出 JSON（不保存文件）
npm run pdf <pdf路径> --json
```

### 输出文件结构

```
extracted/<pdf名称>/
├── content.txt      # 纯文本内容（你应该读取这个来分析）
├── extracted.json   # 完整提取结果
└── info.md          # 元数据摘要
```

## 分析策略（决策方法）

### 场景 1：用户要求分析单个 PDF

**步骤**：
1. 运行 `npm run pdf <路径>` 提取文本
2. 读取 `extracted/<名称>/content.txt`
3. 你自己分析内容，回答用户问题

**示例**：
```
用户: "分析这篇论文 paper.pdf 的主要内容"
你的操作:
  1. npm run pdf paper.pdf
  2. Read extracted/paper/content.txt
  3. 分析文本，提取摘要、关键发现等
```

### 场景 2：用户要求分析多个 PDF

**步骤**：
1. 批量提取：`npm run pdf "papers/*.pdf" --batch`
2. 逐个读取 `extracted/<名称>/content.txt`
3. 你自己分析每个文件
4. 综合对比分析

**示例**：
```
用户: "对比分析这 3 篇论文"
你的操作:
  1. npm run pdf "papers/*.pdf" --batch
  2. Read extracted/paper1/content.txt
  3. Read extracted/paper2/content.txt
  4. Read extracted/paper3/content.txt
  5. 综合对比分析
```

### 场景 3：PDF 内容很长，上下文可能不够

**策略**：
- 先读取 `extracted/<名称>/info.md` 了解基本信息（页数、字符数）
- 如果字符数很大（>50000），考虑分段读取或只提取关键部分
- 告知用户可能需要分步分析

### 场景 4：用户反复问同一个 PDF 的问题

**策略**：
- 工具有缓存机制，重复提取会使用缓存
- 你可以直接读取之前提取的文件，不需要重新运行工具

## 分析能力

当你读取 PDF 文本后，你可以执行以下分析：

### 1. 摘要分析
提取：标题、摘要、关键发现、研究方法、结论、关键词

### 2. 参考文献提取
识别 References 部分，提取作者、年份、标题

### 3. 表格图表识别
识别文中提到的 Table、Figure，提取标题和描述

### 4. 问答
基于文献内容回答用户的具体问题

### 5. 对比分析
对比多篇论文的异同

## 注意事项

1. **你负责分析**：工具只提取文本，分析由你完成
2. **模型由你决定**：你使用什么模型分析，由 Claude Code 配置决定，与工具无关
3. **上下文管理**：大型 PDF 可能占用较多上下文，注意控制
4. **缓存有效**：同一个 PDF 重复提取会使用缓存，节省时间

## 首次使用

```bash
# 安装依赖
npm install

# 测试提取
npm run pdf <某个pdf文件>
```
