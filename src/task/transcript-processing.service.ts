import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ConfigService } from '@nestjs/config';

const modelName = process.env.MODEL || 'gpt-4o';
const batchSize = parseInt(process.env.BATCH_SIZE || '100', 10);

@Injectable()
export class TranscriptProcessingService {
  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
  ) {}

  async runTranscriptCleaning(
    taskId: string,
    transcriptText: string,
  ): Promise<string[]> {
    const taskPath = this.localStorage.getTaskFolder(taskId);
    const segments = transcriptText.split(/\n(?=\d+\.\ds\s*-\s*\d+\.\ds:)/g);
    const batches = Math.ceil(segments.length / batchSize);
    const allResults: any[] = [];

    for (let i = 0; i < batches; i++) {
      const rawFile = path.join(taskPath, `batch_${i + 1}.json`);
      if (fs.existsSync(rawFile)) {
        const parsed = JSON.parse(fs.readFileSync(rawFile, 'utf-8'));
        allResults.push(...parsed);
        continue;
      }

      const prompt = this.generatePrompt(
        segments.slice(i * batchSize, (i + 1) * batchSize).join('\n'),
      );

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await this.openai.chat.completions.create({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
          });

          const content = response.choices[0].message.content?.trim();
          if (!content) throw new Error('Empty content');

          const rawPath = path.join(taskPath, `batch_${i + 1}.json.raw.txt`);
          fs.writeFileSync(rawPath, content, 'utf-8');

          const cleaned = this.extractJson(content);
          const parsed = JSON.parse(cleaned);
          fs.writeFileSync(rawFile, JSON.stringify(parsed, null, 2), 'utf-8');
          allResults.push(...parsed);
          break;
        } catch (err) {
          if (attempt === 3)
            console.error(`Batch ${i + 1} failed after 3 retries`, err);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    const outputPath = path.join(taskPath, 'output.json');
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
    return allResults;
  }

  private generatePrompt(batchText: string): string {
    return PROMPT_TEMPLATE.replace('<<<TRANSCRIPT>>>', batchText);
  }

  private extractJson(content: string): string {
    const match = content.match(/```json\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    return content.replace(/```json|```/g, '').trim();
  }
}

const PROMPT_TEMPLATE = `你是一个转录优化助手...（省略）...下面是我要处理的 transcript（你每次只处理不超过100条）：\n<<<TRANSCRIPT>>>`;
