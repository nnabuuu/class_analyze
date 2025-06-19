import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';
import { TaskStageHandler } from './stage-handler.interface';
import { StageHandlerBase } from './stage-handler.base';
import { TaskStage } from '../task.types';
import { TaskEventAnalyzeStageHandler } from './task-event-analyze.stage-handler';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { DeepAnalyzeItem } from './deep-analyze-item.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportGenerationStageHandler extends StageHandlerBase implements TaskStageHandler {
  readonly stage = 'report_generation';
  readonly outputFiles = ['tasks_report.md'];
  readonly dependsOn = [TaskEventAnalyzeStageHandler];

  constructor(
    private readonly localStorage: LocalStorageService,
    @Inject('DEEP_ANALYZE_ITEMS')
    @Optional()
    private readonly deepAnalyzeItems: DeepAnalyzeItem[] = [],
    @Inject(forwardRef(() => 'TASK_STAGE_HANDLERS'))
    @Optional()
    handlers: TaskStageHandler[] = [],
  ) {
    super(handlers);
  }

  async handle(taskId: string): Promise<void> {
    const [prevFile] = this.getStageOutputs(this.dependsOn);
    const tasks = this.localStorage.readJson(taskId, prevFile);

    const lines: string[] = [];
    lines.push('# 课堂结构报告');
    lines.push('');

    const syllabusContent = this.localStorage.readTextFileSafe(
      taskId,
      'mapped_syllabus.json',
    );
    if (syllabusContent) {
      lines.push('## 教学目标分析结果');
      lines.push('');
      lines.push('```json');
      lines.push(syllabusContent);
      lines.push('```');
      lines.push('');
    }

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
      'tasks_report.md',
    );
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  }

}
