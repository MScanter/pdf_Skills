# 使用示例

本文档提供 PDF Analysis Skill 的实际使用示例，展示不同场景下的完整工作流程。

## 场景 1：分析单个学术论文

### 用户需求
"分析这篇论文 paper.pdf 的主要内容"

### 工作流程

**步骤 1：提取 PDF 文本**
```bash
npm run pdf paper.pdf
```

输出：
```
正在加载 PDF: /path/to/paper.pdf
PDF 加载完成: 15 页, 23456 字符, hash: a1b2c3d4e5f6
✓ 已保存: extracted/paper/extracted.json
✓ 已保存: extracted/paper/content.txt
✓ 已保存: extracted/paper/info.md

✓ 提取完成
```

**步骤 2：读取文本内容**
```bash
Read extracted/paper/content.txt
```

**步骤 3：分析并回答**
根据读取的内容，提取：
- 标题和作者
- 研究背景和动机
- 主要方法
- 关键发现
- 结论和贡献

### 示例输出

```
论文分析：

**标题**：Deep Learning for Natural Language Processing
**作者**：John Doe et al.

**主要内容**：
1. 研究背景：当前 NLP 模型在长文本理解上的局限性
2. 提出方法：基于 Transformer 的新型注意力机制
3. 关键发现：
   - 在 GLUE 基准上提升 3.2%
   - 训练时间减少 40%
   - 参数量降低 25%
4. 主要贡献：提供了更高效的长文本建模方案

**建议阅读重点**：第 3-4 节的方法描述和第 6 节的实验结果。
```

---

## 场景 2：对比多篇论文

### 用户需求
"对比 papers/ 目录下这 3 篇论文的研究方法"

### 工作流程

**步骤 1：批量提取**
```bash
npm run pdf "papers/*.pdf" --batch
```

输出：
```
========== 批量提取模式 ==========
共 3 个 PDF 文件
并行数: 3

[1/3] 处理: paper1.pdf
[2/3] 处理: paper2.pdf
[3/3] 处理: paper3.pdf
✓ 完成: paper1.pdf
✓ 完成: paper2.pdf
✓ 完成: paper3.pdf

========== 批量提取完成 ==========
成功: 3/3
```

**步骤 2：逐个读取**
```bash
Read extracted/paper1/content.txt
Read extracted/paper2/content.txt
Read extracted/paper3/content.txt
```

**步骤 3：综合对比分析**

### 示例输出

```
对比分析：3 篇论文的研究方法

| 论文 | 方法类型 | 数据集 | 核心创新 |
|------|---------|--------|---------|
| Paper 1 | 监督学习 | GLUE | 改进注意力机制 |
| Paper 2 | 自监督学习 | CommonCrawl | 对比学习框架 |
| Paper 3 | 强化学习 | 自建数据集 | 多任务奖励函数 |

**共同点**：
- 都基于 Transformer 架构
- 都关注长文本建模
- 都在标准基准上验证

**差异点**：
- Paper 1 强调效率，Paper 2 强调泛化，Paper 3 强调可控性
- 训练策略完全不同

**推荐**：如果你关注效率，优先阅读 Paper 1；如果关注泛化能力，选择 Paper 2。
```

---

## 场景 3：处理大型 PDF（>100 页）

### 用户需求
"分析这本 300 页的技术手册"

### 工作流程

**步骤 1：先查看元数据**
```bash
npm run pdf manual.pdf
Read extracted/manual/info.md
```

输出：
```markdown
# manual

**文件**: manual.pdf
**页数**: 300
**字符数**: 450000
**Hash**: xyz789abc123
**提取时间**: 2023-12-19 10:00:00
```

**步骤 2：评估策略**
450,000 字符 ≈ 90,000 tokens，对于单次分析可能过大。

**策略选择**：
1. **方案 A**：分段分析
   - 先读取前 50 页内容
   - 根据用户具体问题，再读取相关章节

2. **方案 B**：摘要式分析
   - 提取目录结构
   - 提取各章节标题
   - 根据用户需求定位章节

### 示例输出

```
这份技术手册共 300 页（约 45 万字符），内容较多。

我已提取全部文本。为了高效分析，建议：

1. 如果你想了解整体结构，我可以提取目录和各章节标题
2. 如果你有具体问题（如"如何配置 X"），我可以定位相关章节深入分析
3. 如果需要全面总结，我们可以分章节逐步分析

请告诉我你最关心的内容？
```

---

## 场景 4：使用缓存（重复分析）

### 用户需求
第一次："分析 paper.pdf 的摘要"
第二次（5 分钟后）："paper.pdf 中的参考文献有哪些？"

### 工作流程

**第一次提取**：
```bash
npm run pdf paper.pdf
```
输出：正常提取，耗时 2 秒

**第二次提取**：
```bash
npm run pdf paper.pdf
```
输出：
```
正在加载 PDF: /path/to/paper.pdf
PDF 加载完成: 15 页, 23456 字符, hash: a1b2c3d4e5f6
📦 使用缓存 (hash: a1b2c3d4e5f6)
```
耗时 < 0.1 秒（直接使用缓存）

**优势**：
- 无需重复解析 PDF
- 提取速度提升 20+ 倍
- 直接读取已提取的文本文件

---

## 场景 5：批量提取失败处理

### 用户需求
"批量分析 papers/ 目录下的所有 PDF"

### 可能的问题

某些 PDF 可能无法提取：
- 加密保护的 PDF
- 损坏的 PDF 文件
- 非标准格式的 PDF

### 工作流程

```bash
npm run pdf "papers/*.pdf" --batch
```

输出：
```
========== 批量提取模式 ==========
共 5 个 PDF 文件
并行数: 3

[1/5] 处理: paper1.pdf
[2/5] 处理: paper2.pdf
[3/5] 处理: paper3.pdf
✓ 完成: paper1.pdf
✓ 完成: paper2.pdf
✗ 失败: paper3.pdf - PDF 文件损坏

[4/5] 处理: paper4.pdf
[5/5] 处理: paper5.pdf
✓ 完成: paper4.pdf
✓ 完成: paper5.pdf

========== 批量提取完成 ==========
成功: 4/5

失败的文件:
  - paper3.pdf: PDF 文件损坏
```

**处理建议**：
1. 检查失败的 PDF 是否可以手动打开
2. 尝试使用 PDF 修复工具
3. 如果是扫描版，考虑先进行 OCR 处理
4. 继续分析成功提取的 4 篇论文

---

## 场景 6：JSON 模式输出（集成到其他工具）

### 用户需求
"提取 PDF 内容但只输出 JSON，我要用脚本处理"

### 工作流程

```bash
npm run pdf paper.pdf --json
```

输出（仅 JSON，不保存文件）：
```json
{
  "pdfPath": "/path/to/paper.pdf",
  "metadata": {
    "title": "Deep Learning for NLP",
    "author": "John Doe",
    "pages": 15,
    "creationDate": "2023-01-01T00:00:00.000Z"
  },
  "text": "完整的 PDF 文本内容...\n\n很长的文本...",
  "hash": "a1b2c3d4e5f6",
  "extractedAt": "2023-12-19T10:00:00.000Z"
}
```

**用途**：
- 集成到自动化脚本
- 传输到其他工具处理
- 保存到数据库

---

## 场景 7：指定输出目录

### 用户需求
"将提取结果保存到 results/ 目录而不是默认的 extracted/"

### 工作流程

```bash
npm run pdf paper.pdf -o results
```

输出：
```
✓ 已保存: results/paper/extracted.json
✓ 已保存: results/paper/content.txt
✓ 已保存: results/paper/info.md
```

目录结构：
```
results/
└── paper/
    ├── content.txt
    ├── extracted.json
    └── info.md
```

---

## 高级使用技巧

### 技巧 1：结合 grep 快速定位

如果 PDF 很大，可以先用 grep 定位关键词：

```bash
grep -n "methodology" extracted/paper/content.txt
```

输出：
```
245:## 3. Methodology
256:Our methodology consists of three stages...
```

然后只读取相关部分。

### 技巧 2：对比提取前后文件大小

```bash
ls -lh paper.pdf
ls -lh extracted/paper/content.txt
```

通常文本文件是 PDF 的 1/20 ~ 1/100。

### 技巧 3：验证缓存状态

```bash
ls -la .cache/
```

查看已缓存的 PDF hash 列表。

---

## 常见工作流总结

| 需求 | 命令 | 后续操作 |
|------|------|---------|
| 分析单个 PDF | `npm run pdf <path>` | 读取 content.txt 并分析 |
| 对比多个 PDF | `npm run pdf "*.pdf" --batch` | 逐个读取并对比 |
| 快速提取（不保存） | `npm run pdf <path> --json` | 处理 JSON 输出 |
| 自定义输出位置 | `npm run pdf <path> -o <dir>` | 从指定目录读取 |
| 大文件分析 | 先查看 info.md | 分段处理 |
| 重复分析 | 直接读取已提取文件 | 利用缓存 |
