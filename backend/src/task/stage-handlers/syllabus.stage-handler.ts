import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { ConfigService } from '@nestjs/config';
import { extractLargestJsonBlock } from '../../utils';
import { TaskStageHandler } from './stage-handler.interface';
import { StageHandlerBase } from './stage-handler.base';
import { TaskStage } from '../task.types';
import { TaskEventAnalyzeStageHandler } from './task-event-analyze.stage-handler';
import {
  TaskEventAnalyzeOutputSchema,
  SyllabusMappingOutput,
  SyllabusMappingOutputSchema,
  ClassInfoSchema,
} from '../../models';

@Injectable()
export class SyllabusMappingStageHandler
  extends StageHandlerBase
  implements TaskStageHandler
{
  static stage: TaskStage = 'syllabus_mapping';
  static outputFiles = ['mapped_syllabus.json', 'class_info.json'];
  static dependsOn = [TaskEventAnalyzeStageHandler];

  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });

  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async handle(taskId: string): Promise<void> {
    const [prevFile] = this.getStageOutputs();
    const tasksRaw = JSON.parse(
      this.localStorage.readTextFile(taskId, prevFile),
    );
    const tasks = TaskEventAnalyzeOutputSchema.parse(tasksRaw);

    const envPath = this.config.get<string>('SYLLABUS_ITEMS_PATH');
    const syllabusPath = envPath
      ? path.resolve(envPath)
      : path.join(__dirname, '../../assets/syllabus_items.json');
    const syllabusItems = JSON.parse(fs.readFileSync(syllabusPath, 'utf-8'));

    const results: SyllabusMappingOutput = [];
    const knowledgePoints = new Set<string>();
    const teachingObjectives = new Set<string>();
    let subject = 'Unknown';
    let level = 'Unknown';

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
            content:
              '你是一个教学分析助手，帮助匹配教学任务与教学目标，并推断课程的学科和年级。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0].message.content?.trim();
      const parsed = this.extractJson(content);

      const matches = Array.isArray(parsed) ? parsed : parsed.matches;
      if (parsed.subject) subject = parsed.subject;
      if (parsed.level) level = parsed.level;

      if (Array.isArray(matches)) {
        matches.forEach((m: any) => {
          const item = selectedItems[m.id - 1];
          if (item) {
            knowledgePoints.add(item.topic);
            teachingObjectives.add(item.objective);
          }
        });
      }

      results.push({
        task_title: task.task_title,
        event_summary: task.summary,
        matched: matches,
      });
    }

    const validated = SyllabusMappingOutputSchema.parse(results);

    this.localStorage.saveFile(
      taskId,
      'mapped_syllabus.json',
      JSON.stringify(validated, null, 2),
    );

    const classInfo = ClassInfoSchema.parse({
      subject,
      level,
      knowledgePoints: Array.from(knowledgePoints),
      teachingObjectives: Array.from(teachingObjectives),
      curriculum: 'Unknown',
      confidence: 0.6,
    });

    this.localStorage.saveFile(
      taskId,
      'class_info.json',
      JSON.stringify(classInfo, null, 2),
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
    return `教学任务标题：${task.task_title}\n总结：${task.summary}\n\n以下是候选教学目标：\n${list}\n\n请推断本任务所属的学科和适用年级，并输出最相关的编号（可多选）与理由，格式如下：\n{\n  \"subject\": \"学科\",\n  \"level\": \"年级\",\n  \"matches\": [ { \"id\": 1, \"reason\": \"...\" } ]\n}`;
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
