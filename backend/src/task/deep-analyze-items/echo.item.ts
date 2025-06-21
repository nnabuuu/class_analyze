import { Injectable } from '@nestjs/common';
import { DeepAnalyzeItem } from '../stage-handlers/deep-analyze-item.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TaskEventAnalyzeStageHandler } from '../stage-handlers/task-event-analyze.stage-handler';
import {
  EchoAnalysisSchema,
  EchoAnalysis,
  TaskEventAnalyzeOutputSchema,
} from '../../models';

@Injectable()
export class EchoDeepAnalyzeItem implements DeepAnalyzeItem {
  readonly name = 'echo';
  readonly dependsOn = [TaskEventAnalyzeStageHandler];
  readonly outputFiles = ['echo_summary.json'];

  constructor(private readonly storage: LocalStorageService) {}

  async analyze(taskId: string): Promise<void> {
    const tasksRaw = this.storage.readJson(taskId, 'task_events.json');
    const tasks = TaskEventAnalyzeOutputSchema.parse(tasksRaw);
    const data: EchoAnalysis = EchoAnalysisSchema.parse({
      tasksCount: tasks.length,
    });
    this.storage.saveFile(
      taskId,
      'echo_summary.json',
      JSON.stringify(data, null, 2),
    );
  }
}
