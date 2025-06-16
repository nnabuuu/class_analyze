import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { TaskStageHandler } from './stage-handler.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { extractLargestJsonBlock } from '../../utils';
import { TaskStage } from '../task.types';

const modelName = process.env.MODEL || 'gpt-4o';
const chunkSize = parseInt(process.env.CHUNK_SIZE || '300', 10);
const overlap = parseInt(process.env.OVERLAP || '30', 10);

@Injectable()
export class TaskEventAnalyzeStageHandler implements TaskStageHandler {
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
  ) {}

  readonly stage: TaskStage = 'task-event-analyze';

  async handle(taskId: string): Promise<void> {
    const transcript = this.localStorage.readJsonSafe(taskId, 'input.json');
    await this._process(taskId, transcript);
  }

  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });

  private async _process(
    taskId: string,
    transcriptJson: any[],
  ): Promise<string> {
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

1️⃣ 第一层是 Task（教学任务），通常一节课有 3~5 个任务，代表教学内容的自然模块。
2️⃣ 每个 Task 下，细分为多个 Event，代表教学环节，比如“教师讲解”、“学生提问回答”、“转场过渡”、“课堂讨论”、“实验观察”等。
3️⃣ 每个 Event 下是若干句子（含时间、角色判断），表示具体语音内容。

如果发现当前段落内容是前一个 Task / Event 的延续，可以继续生成对应 Task / Event，不要强行新建 Task / Event。

最终输出格式为严格的 JSON，示例如下：

[
  {
    "task_title": "Task 的标题（自动归纳）",
    "events": [
      {
        "event_type": "事件类型（如教师讲解、互动提问、转场过渡等）",
        "summary": "这段教学活动的大意简要概述",
        "sentences": [
          { "start": 0.0, "end": 4.0, "text": "...", "speaker_probabilities": {"teacher": 1.0, "student": 0.0} },
          ...
        ]
      }
    ]
  }
]

注意事项：
- Task 与 Event 的划分请根据内容语义自动判断，不能按固定长度或固定时间切段。
- Event 类型尽量明确具体，不要用“未知”或“其他”。
- 保留每句的时间戳和说话人角色推断。
- 最终只输出符合上述格式的 JSON，不要添加解释或注释。`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
