import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { ConfigService } from '@nestjs/config';
import { extractLargestJsonBlock } from '../../utils';
import { TaskStageHandler } from './stage-handler.interface';
import { TaskStage } from '../task.types';

const modelName = process.env.MODEL || 'gpt-4o';
const batchSize = parseInt(process.env.BATCH_SIZE || '100', 10);

@Injectable()
export class TranscriptProcessingStageHandler implements TaskStageHandler {
  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
  ) {}

  stage: TaskStage = 'transcript_preprocessing';
  readonly outputFiles = ['input.json'];
  async handle(taskId: string): Promise<void> {
    const transcriptText = this.localStorage.readTextFile(taskId, 'input.txt');
    const cleaned = await this._runTranscriptCleaning(taskId, transcriptText);
    this.localStorage.saveFile(
      taskId,
      'input.json',
      JSON.stringify(cleaned, null, 2),
    );
  }

  async _runTranscriptCleaning(
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

          const cleaned = extractLargestJsonBlock(content);
          if (!cleaned) {
            throw new Error('❌ Empty response from model.');
          }
          console.log(cleaned);

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
}

const PROMPT_TEMPLATE = `你是一个转录优化助手，帮助我修正语音转文字中的错误，并推断每句话的说话人角色比例。

我会给你一段转录文本，格式如下：

时间段（start - end）: 原文字

请你做以下事情：

1️⃣ 修正原文中的识别错误（例如同音字、术语错误、重复词、语病、断句不合理、错别字），使其通顺、符合正常口语，保留教学内容原意。
2️⃣ 不改变时间段（start - end），保留原时间段。
3️⃣ 推断该句子是由 教师 或 学生 说出的，并以百分比形式标注 teacher 和 student 比例（比例和为1）。
4️⃣ **重要规则**：  
    - 对于原文中连续重复出现的无意义词汇（如重复单字、噪声词、“哦哦哦”、“啊啊啊”），请主动删除该 sentence，对应时间段保留跳过。
    - 如果某一 sentence 仅含有单个重复字且连续出现，请直接删除该 sentence，时间段可以保留跳过。
    - 如果某一 sentence 是录音杂音、无意义短句（如“嗯”、“哦”、“呃”、“哈”等）且无法推断出有效教学内容，请删除该 sentence。
    - 请保证剩下的 sentence 是有价值、可读、有教学意义的口语表达。

5️⃣ 最终以 **严格的JSON数组格式**输出，每一项包含：
    - start
    - end
    - text （修正后的文字）
    - speaker_probabilities （包含 teacher 和 student）

⚠️ 只输出 JSON，不要输出解释说明，不要输出 "已完成" 文字。
⚠️ 输出中的 JSON 请去除重复、噪声、无意义短句，保证质量。

示例格式：

[
  {
    "start": 0.0,
    "end": 4.0,
    "text": "同学们,我们生活在一个充满声音和光的世界里",
    "speaker_probabilities": {
      "teacher": 1.0,
      "student": 0.0
    }
  },
  ...
]

下面是我要处理的 transcript （你每次只处理不超过100条）：
<<<TRANSCRIPT>>>
`;
