import { Inject, Injectable, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TaskStage } from '../task.types';
import { TaskStageHandler } from './stage-handler.interface';
import { StageHandlerBase } from './stage-handler.base';
import { DeepAnalyzeItem } from './deep-analyze-item.interface';
import { TaskEventAnalyzeStageHandler } from './task-event-analyze.stage-handler';

@Injectable()
export class DeepAnalyzeStageHandler
  extends StageHandlerBase
  implements TaskStageHandler
{
  static stage: TaskStage = 'deep_analyze';
  static outputFiles: string[] = [];
  static dependsOn = [TaskEventAnalyzeStageHandler];

  constructor(
    private readonly storage: LocalStorageService,
    @Inject('DEEP_ANALYZE_ITEMS')
    @Optional()
    private readonly items: DeepAnalyzeItem[] = [],
  ) {
    super();
  }

  async handle(taskId: string): Promise<void> {
    const cfg = this.storage.readJsonSafe(taskId, 'config.json');
    const enabled: string[] | null = Array.isArray(cfg?.deepAnalyze)
      ? cfg.deepAnalyze
      : null;
    for (const item of this.items) {
      if (enabled && !enabled.includes(item.name)) continue;
      const required = this.resolveOutputs(item.dependsOn);
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
}
