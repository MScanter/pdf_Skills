# 问题排查指南

本文档提供 PDF Analysis Skill 常见问题的排查和解决方案。

## 安装和配置问题

### Q1: npm install 失败

**症状**：
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**原因**：权限不足

**解决方案**：
```bash
# 方案 A：使用 npx（推荐）
npx tsx src/pdf-analyzer.ts paper.pdf

# 方案 B：使用 sudo（不推荐）
sudo npm install

# 方案 C：修改 npm 全局目录权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install
```

---

### Q2: tsx 命令未找到

**症状**：
```
bash: tsx: command not found
```

**原因**：依赖未正确安装

**解决方案**：
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 或直接使用 npx
npx tsx src/pdf-analyzer.ts paper.pdf
```

---

## PDF 提取问题

### Q3: PDF 文件不存在错误

**症状**：
```
错误: PDF 文件不存在: /path/to/paper.pdf
```

**原因**：文件路径错误

**解决方案**：
```bash
# 检查文件是否存在
ls -l paper.pdf

# 使用绝对路径
npm run pdf /Users/username/Documents/paper.pdf

# 检查当前工作目录
pwd

# 使用相对路径（确保在正确的目录）
npm run pdf ./papers/paper.pdf
```

---

### Q4: 提取的文本是乱码

**症状**：
提取的 content.txt 包含乱码或特殊字符

**原因**：
- PDF 使用了非标准编码
- PDF 使用了特殊字体
- PDF 是扫描版（图片）

**解决方案**：

**情况 A：部分乱码**
```bash
# 使用文本编辑器打开，指定 UTF-8 编码
cat extracted/paper/content.txt

# 如果是 macOS
iconv -f UTF-8 -t UTF-8//IGNORE extracted/paper/content.txt > clean.txt
```

**情况 B：完全乱码（扫描版 PDF）**
扫描版 PDF 需要先进行 OCR（光学字符识别）：

1. 使用在线工具：
   - Adobe Acrobat 的 OCR 功能
   - 在线 OCR 工具

2. 使用命令行工具：
```bash
# 安装 tesseract（OCR 引擎）
brew install tesseract  # macOS
sudo apt-get install tesseract-ocr  # Linux

# 转换 PDF 为图片后 OCR
# （需要额外脚本，不在本 skill 范围内）
```

---

### Q5: 提取速度很慢

**症状**：
处理一个 50 页的 PDF 需要 30+ 秒

**原因**：
- PDF 文件过大
- PDF 包含大量图片
- 系统资源不足

**解决方案**：

**检查 PDF 大小**：
```bash
ls -lh paper.pdf
```

如果 PDF > 50MB：
1. 使用 PDF 压缩工具减小文件大小
2. 考虑分段处理
3. 等待首次提取完成后，后续使用缓存

**优化系统性能**：
```bash
# 关闭其他占用资源的应用
# 确保有足够的磁盘空间
df -h
```

---

### Q6: 批量提取时部分失败

**症状**：
```
========== 批量提取完成 ==========
成功: 8/10

失败的文件:
  - paper3.pdf: PDF 文件损坏
  - paper7.pdf: PDF 文件损坏
```

**原因**：
- PDF 文件损坏
- PDF 有密码保护
- PDF 格式不标准

**解决方案**：

**步骤 1：诊断单个文件**
```bash
# 尝试单独提取失败的文件
npm run pdf paper3.pdf
```

**步骤 2：检查 PDF 是否损坏**
```bash
# 尝试用 PDF 阅读器打开
open paper3.pdf  # macOS
xdg-open paper3.pdf  # Linux
```

**步骤 3：修复 PDF**
如果 PDF 损坏：
1. 使用 Adobe Acrobat 的"修复 PDF"功能
2. 使用在线 PDF 修复工具
3. 重新下载原始文件

**步骤 4：处理受保护的 PDF**
如果 PDF 有密码保护：
```bash
# 安装 qpdf
brew install qpdf  # macOS
sudo apt-get install qpdf  # Linux

# 解密 PDF（需要密码）
qpdf --password=yourpassword --decrypt protected.pdf unlocked.pdf

# 再次提取
npm run pdf unlocked.pdf
```

---

## 缓存问题

### Q7: 缓存未生效

**症状**：
重复提取同一个 PDF，没有显示"使用缓存"消息

**原因**：
- 缓存目录被删除
- PDF 文件被修改（内容变化）
- 缓存配置未启用

**解决方案**：

**检查缓存目录**：
```bash
ls -la .cache/
```

**检查 PDF hash**：
```bash
# 提取时会显示 hash
npm run pdf paper.pdf
# 输出：PDF 加载完成: ... hash: abc123456789

# 检查该 hash 的缓存是否存在
ls -la .cache/abc123456789/
```

**强制清除缓存**（如果需要）：
```bash
rm -rf .cache/
```

---

### Q8: 缓存占用空间过大

**症状**：
.cache/ 目录占用磁盘空间太多

**解决方案**：

**查看缓存大小**：
```bash
du -sh .cache/
```

**清理缓存**：
```bash
# 删除所有缓存
rm -rf .cache/

# 或只删除旧缓存（7 天前）
find .cache/ -type f -mtime +7 -delete
```

**配置缓存策略**（未来版本）：
编辑 src/pdf-analyzer.ts 的 CONFIG：
```typescript
const CONFIG = {
  cache: {
    enabled: true,  // 设为 false 禁用缓存
    dir: ".cache",
  },
};
```

---

## 输出文件问题

### Q9: extracted/ 目录未创建

**症状**：
运行 `npm run pdf paper.pdf` 后，找不到 extracted/ 目录

**原因**：
- 使用了 `--json` 参数（不保存文件）
- 提取过程中出错

**解决方案**：

**检查是否使用了 --json**：
```bash
# 确保不加 --json 参数
npm run pdf paper.pdf
```

**检查错误信息**：
如果看到错误，按照错误提示处理。

**手动创建目录**：
```bash
mkdir -p extracted
npm run pdf paper.pdf
```

---

### Q10: content.txt 为空

**症状**：
extracted/paper/content.txt 文件存在但内容为空

**原因**：
- PDF 是纯图片（扫描版）
- PDF 使用了特殊编码
- PDF 内容被加密

**解决方案**：

**检查 PDF 是否为扫描版**：
用 PDF 阅读器打开，尝试选择文本：
- 如果无法选择文本 → 扫描版，需要 OCR
- 如果可以选择文本 → 编码问题

**查看 extracted.json**：
```bash
cat extracted/paper/extracted.json
```

检查 `"text"` 字段是否有内容。

**尝试其他 PDF**：
用简单的 PDF 测试工具是否正常：
```bash
npm run pdf test-simple.pdf
```

---

## Claude Code 集成问题

### Q11: Claude 没有自动识别 Skill

**症状**：
询问 PDF 相关问题时，Claude 没有使用这个 skill

**原因**：
- Skill 未安装到正确位置
- SKILL.md 格式错误
- description 不够清晰

**解决方案**：

**检查 Skill 位置**：
```bash
# 本地 skill（项目级）
ls -la .skills/pdf-analysis/SKILL.md

# 全局 skill
ls -la ~/.claude/skills/pdf-analysis/SKILL.md
```

**验证 SKILL.md 格式**：
```bash
head -10 SKILL.md
```

确保 frontmatter 正确：
```yaml
---
name: analyzing-pdfs
description: Extract text from PDF files and analyze academic papers...
---
```

**测试 description**：
在 Claude Code 中明确提到 PDF 分析任务：
```
"请帮我分析这个 PDF 文件 paper.pdf"
```

---

### Q12: Claude 读取了 PDF 而不是 content.txt

**症状**：
Claude 直接读取 paper.pdf 而不是先提取

**原因**：
- Skill 指令不够明确
- Claude 选择了最直接的方式

**解决方案**：

这种情况下，可以明确要求：
```
"请先使用 PDF 提取工具提取 paper.pdf 的文本，然后分析"
```

或者先手动提取：
```bash
npm run pdf paper.pdf
```

然后告诉 Claude：
```
"我已经提取了文本到 extracted/paper/content.txt，请分析"
```

---

## 性能问题

### Q13: 处理大批量 PDF 时内存不足

**症状**：
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed
```

**原因**：
Node.js 默认内存限制

**解决方案**：

**增加 Node.js 内存限制**：
```bash
# 临时增加到 4GB
NODE_OPTIONS="--max-old-space-size=4096" npm run pdf "papers/*.pdf" --batch

# 或修改 package.json
{
  "scripts": {
    "pdf": "NODE_OPTIONS='--max-old-space-size=4096' tsx src/pdf-analyzer.ts"
  }
}
```

**分批处理**：
```bash
# 不要一次处理所有文件，分批处理
npm run pdf "papers/batch1/*.pdf" --batch
npm run pdf "papers/batch2/*.pdf" --batch
```

---

### Q14: 并行处理太慢

**症状**：
批量处理时，3 个并行似乎不够快

**解决方案**：

**调整并行数**（编辑 src/pdf-analyzer.ts:18）：
```typescript
const CONFIG = {
  parallel: {
    maxConcurrent: 5,  // 从 3 改为 5
  },
};
```

**注意**：
- 并行数过高可能导致内存不足
- 建议根据系统配置调整（CPU 核心数）

---

## 环境兼容性问题

### Q15: Windows 系统路径问题

**症状**：
Windows 上路径分隔符错误

**解决方案**：

使用正斜杠或转义反斜杠：
```bash
# 使用正斜杠（推荐）
npm run pdf "C:/Users/username/papers/paper.pdf"

# 或转义反斜杠
npm run pdf "C:\\Users\\username\\papers\\paper.pdf"
```

---

### Q16: macOS 权限问题

**症状**：
```
Error: EACCES: permission denied
```

**解决方案**：

**检查文件权限**：
```bash
ls -l paper.pdf
chmod 644 paper.pdf
```

**检查目录权限**：
```bash
ls -ld extracted/
chmod 755 extracted/
```

---

## 调试技巧

### 启用详细日志

编辑 src/pdf-analyzer.ts，添加更多 console.log：

```typescript
console.log("调试信息：", someVariable);
```

### 使用 --json 模式测试

```bash
npm run pdf paper.pdf --json > debug.json
cat debug.json | jq .  # 需要安装 jq
```

### 检查依赖版本

```bash
npm list pdf-parse glob tsx
```

确保版本匹配 package.json。

---

## 获取帮助

如果以上方案都无法解决问题：

1. **查看完整错误信息**：
   ```bash
   npm run pdf paper.pdf 2>&1 | tee error.log
   ```

2. **提供诊断信息**：
   - Node.js 版本：`node -v`
   - npm 版本：`npm -v`
   - 操作系统：`uname -a`（Linux/macOS）或 `ver`（Windows）
   - PDF 文件信息：`ls -lh paper.pdf`

3. **提交 Issue**（如果是开源项目）

4. **社区求助**：
   - Claude Code 社区
   - Stack Overflow
   - GitHub Discussions
