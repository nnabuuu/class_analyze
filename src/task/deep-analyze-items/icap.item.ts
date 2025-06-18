import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DeepAnalyzeItem } from '../stage-handlers/deep-analyze-item.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { extractLargestJsonBlock } from '../../utils';

export interface ICAPResult {
  start: number;
  end: number;
  text: string;
  ICAP_mode: 'Passive' | 'Active' | 'Constructive' | 'Interactive';
  reasoning: string;
  confidence: number;
}

const modelName = process.env.MODEL || 'gpt-4o';
const SYSTEM_PROMPT = `你是一位 ICAP 模式分析专家，依据提供的课堂片段信息判断其主要的 ICAP 模式。ICAP 模式只能从以下四个中选择：Passive、Active、Constructive、Interactive。请输出严格的 JSON 对象，格式如下：\n{\n  "ICAP_mode": "Passive|Active|Constructive|Interactive",\n  "reasoning": "简要说明理由",\n  "confidence": 0.8\n}`;

@Injectable()
export class ICAPDeepAnalyzeItem implements DeepAnalyzeItem {
  readonly name = 'icap-analysis';
  readonly dependsOn = 'task-event-analyze' as const;
  readonly outputFiles = ['icap_analysis.json'];

  constructor(private readonly config: ConfigService) {}

  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });

  async analyze(taskId: string, storage: LocalStorageService): Promise<void> {
    const tasks = storage.readJson(taskId, 'output_tasks.json');
    const results: ICAPResult[] = [];

    for (const task of tasks) {
      for (const event of task.events || []) {
        const result = await this.analyzeEvent(event);
        if (result) results.push(result);
        await this.sleep(500);
      }
    }

    storage.saveFile(
      taskId,
      this.outputFiles[0],
      JSON.stringify(results, null, 2),
    );
  }

  private async analyzeEvent(event: any): Promise<ICAPResult | null> {
    const sentences = event.sentences || [];
    if (sentences.length === 0) return null;

    const start = sentences[0].start;
    const end = sentences[sentences.length - 1].end;
    const text = event.summary || sentences.map((s: any) => s.text).join(' ');

    const userPrompt = this.buildUserPrompt(event);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0,
        });

        const raw = response.choices[0].message.content?.trim() || '';
        const cleaned = extractLargestJsonBlock(raw);
        if (!cleaned) throw new Error('Empty response');
        const parsed = JSON.parse(cleaned);

        return {
          start,
          end,
          text,
          ICAP_mode: parsed.ICAP_mode,
          reasoning: parsed.reasoning,
          confidence: parsed.confidence,
        } as ICAPResult;
      } catch (err) {
        if (attempt === 3) console.error('ICAP analysis failed:', err);
        await this.sleep(1000);
      }
    }

    return null;
  }

  private buildUserPrompt(event: any): string {
    const lines = (event.sentences || []).map((s: any) => {
      const speaker =
        (s.speaker_probabilities?.teacher ?? 0) >=
        (s.speaker_probabilities?.student ?? 0)
          ? '教师'
          : '学生';
      return `[${s.start}-${s.end}] ${speaker}: ${s.text}`;
    });

    return `事件类型：${event.event_type}\n事件摘要：${event.summary}\n片段内容：\n${lines.join('\n')}\n请根据以上信息判断该片段的 ICAP 模式，并按照要求输出 JSON。`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
