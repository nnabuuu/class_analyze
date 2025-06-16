import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ConfigService } from '@nestjs/config';
import { extractLargestJsonBlock } from '../utils';

const modelName = process.env.MODEL || 'gpt-4o';
const chunkSize = parseInt(process.env.CHUNK_SIZE || '300', 10);
const overlap = parseInt(process.env.OVERLAP || '30', 10);

@Injectable()
export class ChunkingService {
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
  ) {}

  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });

  async process(taskId: string, transcriptJson: any[]): Promise<string> {
    const taskFolder = this.localStorage.getTaskFolder(taskId);
    const batchesDir = path.join(taskFolder, 'batches');
    if (!fs.existsSync(batchesDir))
      fs.mkdirSync(batchesDir, { recursive: true });

    const totalChunks = Math.ceil(transcriptJson.length / chunkSize);
    const allChunks: any[] = [];

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = Math.max(0, chunkIndex * chunkSize - overlap);
      const end = Math.min(transcriptJson.length, (chunkIndex + 1) * chunkSize);
      const chunk = transcriptJson.slice(start, end);

      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.buildUserPrompt(chunk);

      const response = await this.openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.0,
      });

      const rawContent = response.choices[0].message.content?.trim();
      if (!rawContent) throw new Error('Empty OpenAI response');

      const rawFilePath = path.join(
        batchesDir,
        `task_chunk_${chunkIndex + 1}.json.raw.txt`,
      );
      fs.writeFileSync(rawFilePath, rawContent, 'utf-8');

      const cleaned = extractLargestJsonBlock(rawContent);
      const parsed = JSON.parse(cleaned);
      const cleanFilePath = path.join(
        batchesDir,
        `task_chunk_${chunkIndex + 1}.json`,
      );
      fs.writeFileSync(cleanFilePath, JSON.stringify(parsed, null, 2), 'utf-8');

      allChunks.push(...parsed);
      await this.sleep(1000); // rate limit buffer
    }

    const mergedPath = path.join(taskFolder, 'output_tasks.json');
    fs.writeFileSync(mergedPath, JSON.stringify(allChunks, null, 2), 'utf-8');

    return mergedPath;
  }

  private buildUserPrompt(chunk: any[]): string {
    return `以下是课堂的 sentences 列表（JSON array）：

\`\`\`json
${JSON.stringify(chunk, null, 2)}
\`\`\`

请根据上述规则组织成 3 层结构的 JSON，严格遵循格式要求。`;
  }

  private getSystemPrompt(): string {
    return `你是一个教学内容分析助手，负责将课堂转录文本组织成三层结构的 JSON 数据，层次如下：

1️⃣ 第一层是 Task（教学任务）...
（略：复制你的完整 prompt）
...
请输出严格的 JSON 结构。`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
