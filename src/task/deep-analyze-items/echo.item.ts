import { Injectable } from '@nestjs/common';
import { DeepAnalyzeItem } from '../stage-handlers/deep-analyze-item.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';

@Injectable()
export class EchoDeepAnalyzeItem implements DeepAnalyzeItem {
  readonly name = 'echo';
  readonly dependsOn = 'task-event-analyze' as const;
  readonly outputFiles = ['echo.json'];

  constructor(private readonly storage: LocalStorageService) {}

  async analyze(taskId: string): Promise<void> {
    const tasks = this.storage.readJson(taskId, 'output_tasks.json');
    const data = { tasksCount: Array.isArray(tasks) ? tasks.length : 0 };
    this.storage.saveFile(taskId, 'echo.json', JSON.stringify(data, null, 2));
  }
}
