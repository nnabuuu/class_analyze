import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { ConfigService } from '@nestjs/config';
import { extractLargestJsonBlock } from '../../utils';
import { TaskStageHandler } from './stage-handler.interface';
import { TaskStage } from '../task.types';

@Injectable()
export class SyllabusMappingStageHandler implements TaskStageHandler {
  stage: TaskStage = 'syllabus_mapping';
  readonly outputFiles = ['mapped_syllabus.json'];

  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });

  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
  ) {}

  async handle(taskId: string): Promise<void> {
    const tasks = JSON.parse(
      this.localStorage.readTextFile(taskId, 'output_tasks.json'),
    );

    const syllabusPath = path.join(
      __dirname,
      '../../assets/syllabus_items.json',
    );
    const syllabusItems = JSON.parse(fs.readFileSync(syllabusPath, 'utf-8'));

    const results = [];

    for (const task of tasks) {
      const selectedItems = this.filterRelevantItems(
        task.task_title,
        syllabusItems,
      );
      const prompt = this.buildPrompt(task, selectedItems);

      const response = await this.openai.chat.completions.create({
        model: this.config.get('MODEL') || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个教学分析助手，帮助匹配教学任务与教学目标。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0].message.content?.trim();

      results.push({
        task_title: task.task_title,
        event_summary: task.summary,
        matched: this.extractJson(content),
      });
    }

    this.localStorage.saveFile(
      taskId,
      'mapped_syllabus.json',
      JSON.stringify(results, null, 2),
    );
  }

  private filterRelevantItems(title: string, items: any[]): any[] {
    const keywords = ['光', '热', '力', '电', '温度', '声音'];
    const matched = keywords.filter((k) => title.includes(k));
    return items.filter((item) => matched.some((k) => item.topic.includes(k)));
  }

  private buildPrompt(task: any, items: any[]): string {
    const list = items
      .map((item, idx) => `${idx + 1}. ${item.objective}`)
      .join('\n');
    return `教学任务标题：${task.task_title}\n总结：${task.summary}\n\n以下是候选教学目标：\n${list}\n\n请输出最相关的编号（可多选）与理由，格式如下：\n[\n  { \"id\": 1, \"reason\": \"...\" }\n]`;
  }

  private extractJson(content: string): any {
    try {
      const json = extractLargestJsonBlock(content);
      return JSON.parse(json);
    } catch (e) {
      return { error: 'Failed to parse GPT response', raw: content };
    }
  }
}
