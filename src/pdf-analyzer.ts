import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

interface PDFMetadata {
  title?: string;
  author?: string;
  pages: number;
  creationDate?: Date;
}

interface SummaryResult {
  title: string;
  abstract: string;
  keyFindings: string[];
  methodology?: string;
  conclusions?: string;
  keywords: string[];
}

interface Citation {
  text: string;
  authors?: string[];
  year?: string;
  title?: string;
}

interface TableOrFigure {
  type: "table" | "figure";
  caption?: string;
  pageNumber?: number;
  content: string;
  analysis?: string;
}

interface QuestionAnswer {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low";
  sources: string[];
}

class PDFAnalyzer {
  private client: Anthropic;
  private pdfPath: string;
  private pdfContent: string = "";
  private pdfMetadata: PDFMetadata = { pages: 0 };

  constructor(pdfPath: string) {
    this.pdfPath = path.resolve(pdfPath);

    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("请设置 ANTHROPIC_AUTH_TOKEN 或 ANTHROPIC_API_KEY 环境变量");
    }

    this.client = new Anthropic({
      apiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });
  }

  async loadPDF(): Promise<void> {
    if (!fs.existsSync(this.pdfPath)) {
      throw new Error(`PDF 文件不存在: ${this.pdfPath}`);
    }

    console.log(`正在加载 PDF: ${this.pdfPath}`);

    const dataBuffer = fs.readFileSync(this.pdfPath);
    const data = await pdfParse(dataBuffer);

    this.pdfContent = data.text;
    this.pdfMetadata = {
      title: data.info?.Title,
      author: data.info?.Author,
      pages: data.numpages,
      creationDate: data.info?.CreationDate,
    };

    console.log(`PDF 加载完成: ${this.pdfMetadata.pages} 页, ${this.pdfContent.length} 字符\n`);
  }

  async extractSummary(): Promise<SummaryResult> {
    console.log("正在提取文献摘要和关键信息...\n");

    const prompt = `请仔细分析这篇学术文献，提取以下信息：

1. 标题（如果 metadata 中没有，请从正文中识别）
2. 摘要（Abstract）的完整内容
3. 关键发现（Key Findings）- 列出 5-10 个要点
4. 研究方法（Methodology）- 简要描述
5. 结论（Conclusions）- 总结主要结论
6. 关键词（Keywords）- 提取 5-8 个核心关键词

请以 JSON 格式返回，格式如下：
{
  "title": "论文标题",
  "abstract": "摘要内容...",
  "keyFindings": ["发现1", "发现2", ...],
  "methodology": "研究方法描述",
  "conclusions": "结论总结",
  "keywords": ["关键词1", "关键词2", ...]
}

文献内容：
${this.pdfContent.slice(0, 50000)}`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("未能获取分析结果");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("未能解析 JSON 结果");
    }

    return JSON.parse(jsonMatch[0]);
  }

  async extractCitations(): Promise<Citation[]> {
    console.log("正在提取和整理参考文献...\n");

    const prompt = `请从这篇学术文献中提取所有参考文献。对于每个引用，尽可能提取：

1. 作者列表
2. 发表年份
3. 论文/书籍标题
4. 完整引用文本

请以 JSON 数组格式返回，格式如下：
[
  {
    "text": "完整引用文本",
    "authors": ["作者1", "作者2"],
    "year": "2023",
    "title": "论文标题"
  },
  ...
]

通常参考文献在文档末尾的 "References" 或 "Bibliography" 部分。

文献内容：
${this.pdfContent}`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("未能获取引用结果");
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  }

  async extractTablesAndFigures(): Promise<TableOrFigure[]> {
    console.log("正在提取表格和图表信息...\n");

    const prompt = `请从这篇学术文献中识别所有的表格（Tables）和图表（Figures）。对于每个表格/图表，提取：

1. 类型（table 或 figure）
2. 标题/说明（Caption）
3. 所在页码（如果能识别）
4. 内容描述或数据
5. 对该表格/图表的简要分析说明

请以 JSON 数组格式返回，格式如下：
[
  {
    "type": "table",
    "caption": "Table 1: Experimental Results",
    "pageNumber": 5,
    "content": "表格内容或描述...",
    "analysis": "这个表格展示了..."
  },
  ...
]

文献内容：
${this.pdfContent}`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("未能获取表格图表结果");
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  }

  async answerQuestion(question: string): Promise<QuestionAnswer> {
    console.log(`正在回答问题: ${question}\n`);

    const prompt = `基于这篇学术文献，请回答以下问题：

问题：${question}

要求：
1. 仔细阅读文献内容
2. 提供详细、准确的答案
3. 标注答案的置信度（high/medium/low）
4. 列出支持答案的文献片段或来源

请以 JSON 格式返回：
{
  "question": "原问题",
  "answer": "详细答案...",
  "confidence": "high",
  "sources": ["支持证据1", "支持证据2", ...]
}

文献内容：
${this.pdfContent}`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("未能获取回答结果");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("未能解析问答结果");
    }

    return JSON.parse(jsonMatch[0]);
  }

  async analyzeAll(): Promise<{
    summary: SummaryResult;
    citations: Citation[];
    tablesAndFigures: TableOrFigure[];
  }> {
    await this.loadPDF();

    console.log("========== 开始全面分析 ==========\n");

    const summary = await this.extractSummary();
    const citations = await this.extractCitations();
    const tablesAndFigures = await this.extractTablesAndFigures();

    return {
      summary,
      citations,
      tablesAndFigures,
    };
  }

  getMetadata(): PDFMetadata {
    return this.pdfMetadata;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("用法:");
    console.error("  npm run pdf <pdf文件路径> [命令] [参数]");
    console.error("\n命令:");
    console.error("  summary    - 提取摘要和关键信息");
    console.error("  citations  - 提取参考文献");
    console.error("  tables     - 提取表格和图表");
    console.error("  question   - 回答问题（需要额外参数：问题内容）");
    console.error("  all        - 执行所有分析（默认）");
    console.error("\n示例:");
    console.error("  npm run pdf paper.pdf summary");
    console.error('  npm run pdf paper.pdf question "这篇论文的主要贡献是什么？"');
    process.exit(1);
  }

  const pdfPath = args[0];
  const command = args[1] || "all";
  const analyzer = new PDFAnalyzer(pdfPath);

  try {
    await analyzer.loadPDF();

    switch (command) {
      case "summary": {
        const result = await analyzer.extractSummary();
        console.log("========== 文献摘要 ==========\n");
        console.log(`标题: ${result.title}\n`);
        console.log(`摘要:\n${result.abstract}\n`);
        console.log(`关键发现:`);
        result.keyFindings.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
        console.log(`\n研究方法:\n${result.methodology}\n`);
        console.log(`结论:\n${result.conclusions}\n`);
        console.log(`关键词: ${result.keywords.join(", ")}`);
        break;
      }

      case "citations": {
        const citations = await analyzer.extractCitations();
        console.log(`========== 参考文献 (共 ${citations.length} 条) ==========\n`);
        citations.forEach((c, i) => {
          console.log(`[${i + 1}] ${c.text}`);
          if (c.authors) console.log(`    作者: ${c.authors.join(", ")}`);
          if (c.year) console.log(`    年份: ${c.year}`);
          if (c.title) console.log(`    标题: ${c.title}`);
          console.log();
        });
        break;
      }

      case "tables": {
        const items = await analyzer.extractTablesAndFigures();
        console.log(`========== 表格和图表 (共 ${items.length} 个) ==========\n`);
        items.forEach((item, i) => {
          console.log(`[${i + 1}] ${item.type === "table" ? "表格" : "图表"}: ${item.caption || "无标题"}`);
          if (item.pageNumber) console.log(`    页码: ${item.pageNumber}`);
          console.log(`    内容: ${item.content}`);
          if (item.analysis) console.log(`    分析: ${item.analysis}`);
          console.log();
        });
        break;
      }

      case "question": {
        const question = args.slice(2).join(" ");
        if (!question) {
          console.error("错误: 请提供问题内容");
          process.exit(1);
        }
        const result = await analyzer.answerQuestion(question);
        console.log("========== 问答结果 ==========\n");
        console.log(`问题: ${result.question}\n`);
        console.log(`答案:\n${result.answer}\n`);
        console.log(`置信度: ${result.confidence}\n`);
        console.log("支持证据:");
        result.sources.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        break;
      }

      case "all": {
        const results = await analyzer.analyzeAll();

        console.log("\n========== 文献摘要 ==========\n");
        console.log(`标题: ${results.summary.title}\n`);
        console.log(`摘要:\n${results.summary.abstract}\n`);

        console.log(`\n========== 参考文献 (共 ${results.citations.length} 条) ==========\n`);
        results.citations.slice(0, 5).forEach((c, i) => {
          console.log(`[${i + 1}] ${c.text.slice(0, 100)}...`);
        });
        if (results.citations.length > 5) {
          console.log(`... 以及其他 ${results.citations.length - 5} 条引用`);
        }

        console.log(`\n========== 表格和图表 (共 ${results.tablesAndFigures.length} 个) ==========\n`);
        results.tablesAndFigures.forEach((item, i) => {
          console.log(`[${i + 1}] ${item.type === "table" ? "表格" : "图表"}: ${item.caption || "无标题"}`);
        });
        break;
      }

      default:
        console.error(`未知命令: ${command}`);
        process.exit(1);
    }

    console.log("\n✓ 分析完成");
  } catch (error) {
    console.error("\n✗ 错误:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PDFAnalyzer, SummaryResult, Citation, TableOrFigure, QuestionAnswer };
