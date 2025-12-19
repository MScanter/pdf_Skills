---
name: pdf-skills
description: Extract text from PDF files so Claude can read, summarize, or compare them without loading the original PDF.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Write
---

# PDF Text Extraction

当用户需要阅读、摘要或对比 PDF 时，先提取文本，再由你完成分析。

## 工作流程

单个 PDF：
1. 运行 `npm run pdf <pdf路径>`
2. 读取 `extracted/<名称>/content.txt`
3. 基于文本回答问题（不要直接读原 PDF）

多个 PDF：
1. `npm run pdf "路径/*.pdf" --batch`
2. 逐个读取 `extracted/<名称>/content.txt`
3. 综合比较后回答

大型 PDF：
- 先看 `extracted/<名称>/info.md`
- 字符数很大时分段分析

## 注意事项

- 工具只做文本提取；分析由你完成。
- 缓存会跳过未变化的文件。
- 始终读取 `content.txt`，避免直接读取 PDF。

## 输出结构

```
extracted/<pdf名称>/
├── content.txt
├── extracted.json
└── info.md
```

同名冲突时会自动追加短 hash。
