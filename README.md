# PDF Skills

面向 Claude Code 的 PDF 文本提取 skill。工具只负责提取文本与元数据，分析由 Claude 完成。

## 安装

```bash
# 放到你的技能目录（示例路径）
git clone <your-repo-url> .skills/pdf-skills
cd .skills/pdf-skills
npm install
```

## 使用

```bash
# 提取单个 PDF
npm run pdf <pdf路径>

# 批量提取
npm run pdf "路径/*.pdf" --batch
```

提取后读取：

```
extracted/<pdf名称>/content.txt
```

同名冲突会自动追加短 hash：

```
extracted/<pdf名称>-<hash>/
```

## 缓存

工具会基于文件 `size/mtimeMs` 判断是否需要重新解析，未变化时直接使用缓存。

## 文档

- `docs/reference.md`
