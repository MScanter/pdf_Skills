---
name: analyzing-pdfs
description: Extract text from PDF files and analyze academic papers. This skill helps when users need to read, summarize, or compare PDF documents. It provides a two-stage workflow - first extracting text using a tool, then analyzing with Claude to avoid context overflow.
allowed-tools: Bash, Read, Glob, Write
version: 2.0.0
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

## 工作流程

### 单个 PDF 分析

1. 运行 `npm run pdf <pdf路径>` 提取文本
2. 读取 `extracted/<名称>/content.txt`
3. 你自己分析内容，回答用户问题

### 多个 PDF 对比

1. 批量提取：`npm run pdf "路径/*.pdf" --batch`
2. 逐个读取 `extracted/<名称>/content.txt`
3. 综合对比分析

### 大型 PDF（>100 页）

1. 先查看 `extracted/<名称>/info.md` 了解基本信息
2. 如果内容很大（>50000 字符），考虑分段分析
3. 告知用户可能需要分步处理

## 输出文件结构

```
extracted/<pdf名称>/
├── content.txt      # 纯文本内容（你应该读取这个来分析）
├── extracted.json   # 完整提取结果
└── info.md          # 元数据摘要
```

## 你的分析能力

当你读取 PDF 文本后，你可以执行：

1. **摘要分析** - 提取标题、摘要、关键发现、方法、结论
2. **参考文献提取** - 识别 References 部分
3. **表格图表识别** - 识别 Table、Figure 的标题和描述
4. **问答** - 基于文献内容回答具体问题
5. **对比分析** - 对比多篇论文的异同

## 关键注意事项

1. **你负责分析** - 工具只提取文本，分析由你完成
2. **上下文管理** - 大型 PDF 可能占用较多上下文，注意控制
3. **缓存有效** - 同一个 PDF 重复提取会使用缓存，节省时间
4. **读取文本文件** - 始终读取 `content.txt` 而非原始 PDF

## 详细文档

- **API 参考**：`docs/reference.md` - 完整命令参数和技术细节
- **使用示例**：`docs/examples.md` - 7 种常见场景的完整示例
- **问题排查**：`docs/troubleshooting.md` - 常见问题和解决方案

## 快速开始

首次使用前，确保依赖已安装：
```bash
npm install
```

测试提取：
```bash
npm run pdf <某个pdf文件>
```
