import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { glob } from "glob";
import crypto from "crypto";

// ==================== 配置 ====================

const CONFIG = {
  // 缓存配置
  cache: {
    enabled: true,
    dir: ".cache",
  },
  // 并行配置
  parallel: {
    maxConcurrent: 3,
  },
};

// ==================== 接口定义 ====================

interface PDFMetadata {
  title?: string;
  author?: string;
  pages: number;
  creationDate?: Date;
}

interface PDFSourceInfo {
  path: string;
  size: number;
  mtimeMs: number;
}

interface ExtractResult {
  pdfPath: string;
  metadata: PDFMetadata;
  text: string;
  hash: string;
  extractedAt: string;
  source: PDFSourceInfo;
}

// ==================== PDF 提取器 ====================

class PDFExtractor {
  private pdfPath: string;
  private cacheKey: string;

  constructor(pdfPath: string) {
    this.pdfPath = path.resolve(pdfPath);
    this.cacheKey = this.computeHash(this.pdfPath);
  }

  // ==================== 缓存功能 ====================

  private computeHash(data: string | Buffer): string {
    return crypto.createHash("md5").update(data).digest("hex").slice(0, 12);
  }

  private getCachePath(): string {
    const cacheDir = path.join(CONFIG.cache.dir, this.cacheKey);
    return path.join(cacheDir, "extracted.json");
  }

  private getSourceInfo(): PDFSourceInfo {
    const stat = fs.statSync(this.pdfPath);
    return {
      path: this.pdfPath,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
    };
  }

  private checkCache(sourceInfo: PDFSourceInfo): ExtractResult | null {
    if (!CONFIG.cache.enabled) return null;

    const cachePath = this.getCachePath();
    if (!fs.existsSync(cachePath)) return null;

    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8")) as ExtractResult;
      const cachedPath =
        typeof cached?.source?.path === "string"
          ? cached.source.path
          : typeof cached?.pdfPath === "string"
            ? cached.pdfPath
            : null;
      const cachedSize =
        typeof cached?.source?.size === "number" ? cached.source.size : null;
      const cachedMtimeMs =
        typeof cached?.source?.mtimeMs === "number"
          ? cached.source.mtimeMs
          : null;

      if (
        cachedPath &&
        path.resolve(cachedPath) === this.pdfPath &&
        cachedSize === sourceInfo.size &&
        cachedMtimeMs === sourceInfo.mtimeMs
      ) {
        console.log(`📦 使用缓存 (path: ${path.basename(this.pdfPath)})`);
        return cached;
      }
    } catch {
      return null;
    }
    return null;
  }

  private saveCache(result: ExtractResult): void {
    if (!CONFIG.cache.enabled) return;

    const cacheDir = path.join(CONFIG.cache.dir, this.cacheKey);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cachePath = this.getCachePath();
    fs.writeFileSync(cachePath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`💾 已缓存`);
  }

  // ==================== 提取功能 ====================

  /**
   * 提取 PDF 文本内容
   */
  async extract(): Promise<ExtractResult> {
    if (!fs.existsSync(this.pdfPath)) {
      throw new Error(`PDF 文件不存在: ${this.pdfPath}`);
    }

    const sourceInfo = this.getSourceInfo();

    // 检查缓存（在解析前）
    const cached = this.checkCache(sourceInfo);
    if (cached) return cached;

    console.log(`正在加载 PDF: ${this.pdfPath}`);

    // 读取 PDF
    const dataBuffer = fs.readFileSync(this.pdfPath);
    const data = await pdfParse(dataBuffer);

    const fileHash = this.computeHash(dataBuffer);
    const metadata: PDFMetadata = {
      title: data.info?.Title,
      author: data.info?.Author,
      pages: data.numpages,
      creationDate: data.info?.CreationDate,
    };

    console.log(`PDF 加载完成: ${metadata.pages} 页, ${data.text.length} 字符, hash: ${fileHash}`);

    // 构建结果
    const result: ExtractResult = {
      pdfPath: this.pdfPath,
      metadata,
      text: data.text,
      hash: fileHash,
      extractedAt: new Date().toISOString(),
      source: sourceInfo,
    };

    // 保存缓存
    this.saveCache(result);

    return result;
  }

  /**
   * 保存提取结果到文件
   */
  private resolveOutputPath(outputDir: string): string {
    const pdfBasename = path.basename(this.pdfPath, ".pdf");
    const basePath = path.join(outputDir, pdfBasename);
    const fallbackPath = path.join(outputDir, `${pdfBasename}-${this.cacheKey}`);

    if (!fs.existsSync(basePath)) {
      return basePath;
    }

    const existingJson = path.join(basePath, "extracted.json");
    if (!fs.existsSync(existingJson)) {
      return fallbackPath;
    }

    try {
      const existing = JSON.parse(fs.readFileSync(existingJson, "utf-8")) as ExtractResult;
      const existingPath =
        typeof existing?.source?.path === "string"
          ? existing.source.path
          : typeof existing?.pdfPath === "string"
            ? existing.pdfPath
            : null;
      if (existingPath && path.resolve(existingPath) === this.pdfPath) {
        return basePath;
      }
    } catch {
      return fallbackPath;
    }

    return fallbackPath;
  }

  /**
   * 保存提取结果到文件
   */
  async saveToFile(result: ExtractResult, outputDir: string): Promise<string[]> {
    const pdfBasename = path.basename(this.pdfPath, ".pdf");
    const outputPath = this.resolveOutputPath(outputDir);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const savedFiles: string[] = [];

    // 保存 JSON（完整信息）
    const jsonPath = path.join(outputPath, "extracted.json");
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
    savedFiles.push(jsonPath);
    console.log(`✓ 已保存: ${jsonPath}`);

    // 保存纯文本（方便 Claude Code 读取）
    const textPath = path.join(outputPath, "content.txt");
    fs.writeFileSync(textPath, result.text, "utf-8");
    savedFiles.push(textPath);
    console.log(`✓ 已保存: ${textPath}`);

    // 保存元数据摘要（Markdown）
    const mdPath = path.join(outputPath, "info.md");
    let md = `# ${pdfBasename}\n\n`;
    md += `**文件**: ${path.basename(result.pdfPath)}\n`;
    md += `**路径**: ${result.pdfPath}\n`;
    md += `**页数**: ${result.metadata.pages}\n`;
    md += `**字符数**: ${result.text.length}\n`;
    md += `**文件哈希**: ${result.hash}\n`;
    md += `**提取时间**: ${new Date(result.extractedAt).toLocaleString("zh-CN")}\n`;
    if (result.metadata.title) md += `**标题**: ${result.metadata.title}\n`;
    if (result.metadata.author) md += `**作者**: ${result.metadata.author}\n`;
    md += `\n## 文件路径\n\n`;
    md += `- 完整文本: \`${textPath}\`\n`;
    md += `- JSON 数据: \`${jsonPath}\`\n`;
    fs.writeFileSync(mdPath, md, "utf-8");
    savedFiles.push(mdPath);
    console.log(`✓ 已保存: ${mdPath}`);

    return savedFiles;
  }

  // ==================== 批量处理 ====================

  static async batchExtract(
    pdfPaths: string[],
    outputDir: string
  ): Promise<void> {
    console.log(`\n========== 批量提取模式 ==========`);
    console.log(`共 ${pdfPaths.length} 个 PDF 文件`);
    console.log(`并行数: ${CONFIG.parallel.maxConcurrent}\n`);

    const processOne = async (pdfPath: string, index: number): Promise<{ success: boolean; name: string; error?: string }> => {
      const name = path.basename(pdfPath);
      console.log(`[${index + 1}/${pdfPaths.length}] 处理: ${name}`);

      try {
        const extractor = new PDFExtractor(pdfPath);
        const result = await extractor.extract();
        await extractor.saveToFile(result, outputDir);
        console.log(`✓ 完成: ${name}\n`);
        return { success: true, name };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ 失败: ${name} - ${errorMsg}\n`);
        return { success: false, name, error: errorMsg };
      }
    };

    // 并行处理
    const results: Array<{ success: boolean; name: string; error?: string }> = [];

    for (let i = 0; i < pdfPaths.length; i += CONFIG.parallel.maxConcurrent) {
      const batch = pdfPaths.slice(i, i + CONFIG.parallel.maxConcurrent);
      const batchPromises = batch.map((pdfPath, batchIndex) =>
        processOne(pdfPath, i + batchIndex)
      );
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // 汇总
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`========== 批量提取完成 ==========`);
    console.log(`成功: ${succeeded}/${pdfPaths.length}`);

    if (failed.length > 0) {
      console.log(`\n失败的文件:`);
      failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
    }
  }
}

// ==================== 命令行入口 ====================

function parseArgs(args: string[]): {
  pdfPaths: string[];
  options: {
    outputDir: string;
    batch: boolean;
    json: boolean;
  };
} {
  const result = {
    pdfPaths: [] as string[],
    options: {
      outputDir: "extracted",
      batch: false,
      json: false,
    },
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--output" || arg === "-o") {
      result.options.outputDir = args[++i] || "extracted";
    } else if (arg === "--batch" || arg === "-b") {
      result.options.batch = true;
    } else if (arg === "--json") {
      result.options.json = true;
    } else if (!arg.startsWith("-")) {
      result.pdfPaths.push(arg);
    }

    i++;
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
PDF 文本提取工具
================

用法:
  npm run pdf <pdf文件路径> [选项]

选项:
  --output, -o <目录>   输出目录（默认: extracted）
  --batch, -b           批量处理模式（支持通配符）
  --json                只输出 JSON 到控制台（不保存文件）

示例:
  npm run pdf paper.pdf
  npm run pdf paper.pdf -o results
  npm run pdf paper.pdf --json
  npm run pdf "papers/*.pdf" --batch

输出文件:
  extracted/<pdf名称>/
  ├── content.txt      # 纯文本内容（Claude Code 可读取分析）
  ├── extracted.json   # 完整提取结果
  └── info.md          # 元数据摘要

  同名冲突会自动追加短 hash
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);

  try {
    // 批量模式
    if (parsed.options.batch) {
      let pdfFiles: string[] = [];

      for (const pattern of parsed.pdfPaths) {
        const matches = await glob(pattern, { absolute: true });
        pdfFiles = pdfFiles.concat(matches.filter(f => f.endsWith(".pdf")));
      }

      if (pdfFiles.length === 0) {
        console.error("错误: 未找到匹配的 PDF 文件");
        process.exit(1);
      }

      await PDFExtractor.batchExtract(pdfFiles, parsed.options.outputDir);
      return;
    }

    // 单文件模式
    const pdfPath = parsed.pdfPaths[0];
    if (!pdfPath) {
      console.error("错误: 请提供 PDF 文件路径");
      process.exit(1);
    }

    const extractor = new PDFExtractor(pdfPath);
    const result = await extractor.extract();

    // JSON 模式：只输出到控制台
    if (parsed.options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // 保存到文件
    await extractor.saveToFile(result, parsed.options.outputDir);

    console.log(`\n✓ 提取完成`);
    console.log(`\n提示: Claude Code 可读取 extracted/<名称>/content.txt（同名冲突会带 hash）`);

  } catch (error) {
    console.error("\n✗ 错误:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PDFExtractor, ExtractResult, PDFMetadata };
