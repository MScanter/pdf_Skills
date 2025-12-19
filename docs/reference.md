# Reference

## Commands

```bash
# 单个 PDF
npm run pdf <pdf路径>

# 批量提取
npm run pdf "路径/*.pdf" --batch

# 指定输出目录
npm run pdf <pdf路径> -o <输出目录>

# 只输出 JSON（不保存文件）
npm run pdf <pdf路径> --json
```

## Options

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--output` | `-o` | 输出目录 | `extracted` |
| `--batch` | `-b` | 批量模式（支持通配符） | - |
| `--json` | - | 仅输出 JSON，不保存文件 | - |

## Output

默认输出到 `extracted/`：

```
extracted/<pdf名称>/
├── content.txt
├── extracted.json
└── info.md
```

如果同名文件冲突，会自动追加短 hash：

```
extracted/<pdf名称>-<hash>/
```

`extracted.json` 结构示例：

```json
{
  "pdfPath": "/path/to/paper.pdf",
  "metadata": {
    "title": "Paper Title",
    "author": "Author Name",
    "pages": 10,
    "creationDate": "2023-01-01T00:00:00.000Z"
  },
  "text": "完整文本内容...",
  "hash": "abc123456789",
  "extractedAt": "2023-12-19T10:00:00.000Z",
  "source": {
    "path": "/path/to/paper.pdf",
    "size": 123456,
    "mtimeMs": 1700000000000
  }
}
```

说明：
- `hash` 为文件内容哈希（用于展示，不作为缓存键）
- `source` 用于缓存校验

## Cache

- 缓存按文件路径 hash 存储：`.cache/<path-hash>/extracted.json`
- 当文件 `size/mtimeMs` 未变化时直接使用缓存，跳过解析

## Limitations

- 扫描版 PDF 需 OCR 才能提取文字
- 复杂排版可能影响文本顺序
