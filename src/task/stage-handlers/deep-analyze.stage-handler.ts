import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TaskStage } from '../task.types';
import { TaskStageHandler } from './stage-handler.interface';
import { DeepAnalyzeItem } from './deep-analyze-item.interface';
import { TaskEventAnalyzeStageHandler } from './task-event-analyze.stage-handler';

@Injectable()
export class DeepAnalyzeStageHandler implements TaskStageHandler {
  readonly stage: TaskStage = 'deep_analyze';
  readonly outputFiles: string[] = [];
  readonly dependsOn = [TaskEventAnalyzeStageHandler];

  constructor(
    private readonly storage: LocalStorageService,
    @Inject('DEEP_ANALYZE_ITEMS')
    @Optional()
    private readonly items: DeepAnalyzeItem[] = [],
    @Inject(forwardRef(() => 'TASK_STAGE_HANDLERS'))
    @Optional()
    private readonly handlers: TaskStageHandler[] = [],
  ) {}

  async handle(taskId: string): Promise<void> {
    for (const item of this.items) {
      const required = this.getStageOutputs(item.dependsOn);
      const folder = this.storage.getTaskFolder(taskId);
      const missing = required.find(
        (f) => !fs.existsSync(path.join(folder, f)),
      );
      if (missing) {
        console.warn(
          `⚠️ Skipping deep analyze item "${item.name}" due to missing prerequisite file ${missing}`,
        );
        continue;
      }
      await item.analyze(taskId);
    }
  }

  private getStageOutputs(
    stages?: new (...args: any[]) => TaskStageHandler | Array<new (...args: any[]) => TaskStageHandler>,
  ): string[] {
    if (!stages) return [];
    const deps = Array.isArray(stages) ? stages : [stages];
    const outputs: string[] = [];
    for (const dep of deps) {
      const handler = this.handlers.find((h) => h instanceof dep);
      if (handler?.outputFiles) outputs.push(...handler.outputFiles);
    }
    return outputs;
  }
}
