import { Injectable } from '@nestjs/common';
import { DeepAnalyzeItem } from '../stage-handlers/deep-analyze-item.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import {
  EchoAnalysisSchema,
  EchoAnalysis,
  TaskEventAnalyzeOutputSchema,
} from '../../models';

@Injectable()
export class EchoDeepAnalyzeItem implements DeepAnalyzeItem {
  readonly name = 'echo';
  readonly dependsOn = 'task-event-analyze' as const;
  readonly outputFiles = ['echo.json'];

  constructor(private readonly storage: LocalStorageService) {}

  async analyze(taskId: string): Promise<void> {
    const tasksRaw = this.storage.readJson(taskId, 'output_tasks.json');
    const tasks = TaskEventAnalyzeOutputSchema.parse(tasksRaw);
    const data: EchoAnalysis = EchoAnalysisSchema.parse({
      tasksCount: tasks.length,
    });
    this.storage.saveFile(taskId, 'echo.json', JSON.stringify(data, null, 2));
  }
}
