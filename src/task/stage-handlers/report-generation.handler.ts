import { Inject, Injectable, Optional } from '@nestjs/common';
import { TaskStageHandler } from './stage-handler.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { DeepAnalyzeItem } from './deep-analyze-item.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportGenerationStageHandler implements TaskStageHandler {
  readonly stage = 'report_generation';
  readonly outputFiles = ['output_tasks_report.md'];

  constructor(
    private readonly localStorage: LocalStorageService,
    @Inject('DEEP_ANALYZE_ITEMS')
    @Optional()
    private readonly deepAnalyzeItems: DeepAnalyzeItem[] = [],
  ) {}

  async handle(taskId: string): Promise<void> {
    const tasks = this.localStorage.readJson(taskId, 'output_tasks.json');

    const lines: string[] = [];
    lines.push('# 课堂结构报告');
    lines.push('');

    tasks.forEach((task: any, taskIndex: number) => {
      lines.push(`## 教学任务 ${taskIndex + 1}：${task.task_title}`);
      lines.push('');

      task.events.forEach((event: any, eventIndex: number) => {
        lines.push(`### 教学环节 ${eventIndex + 1}：${event.event_type}`);
        lines.push(`**环节概述：** ${event.summary}`);
        lines.push('');

        event.sentences.forEach((sentence: any) => {
          const speaker =
            sentence.speaker_probabilities.teacher >
            sentence.speaker_probabilities.student
              ? '教师'
              : '学生';
          lines.push(
            `- [${sentence.start}s - ${sentence.end}s] **${speaker}**：${sentence.text}`,
          );
        });

        lines.push('');
      });

      lines.push('');
    });

    if (this.deepAnalyzeItems.length > 0) {
      lines.push('# 深度分析');
      lines.push('');
      for (const item of this.deepAnalyzeItems) {
        const outputFile = item.outputFiles[0];
        const content = this.localStorage.readTextFileSafe(taskId, outputFile);
        if (content) {
          lines.push(`## ${item.name}`);
          lines.push('');
          lines.push('```json');
          lines.push(content);
          lines.push('```');
          lines.push('');
        }
      }
    }

    const reportPath = path.join(
      this.localStorage.getTaskFolder(taskId),
      'output_tasks_report.md',
    );
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  }
}
