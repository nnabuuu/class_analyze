import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TaskStage } from '../task.types';
import { TaskStageHandler } from './stage-handler.interface';
import { DeepAnalyzeItem } from './deep-analyze-item.interface';

@Injectable()
export class DeepAnalyzeStageHandler implements TaskStageHandler {
  readonly stage: TaskStage = 'deep_analyze';
  readonly outputFiles: string[] = [];

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

  private getStageOutputs(stage: TaskStage): string[] {
    const handler = this.handlers.find((h) => h.stage === stage);
    return handler?.outputFiles ?? [];
  }
}
