import { Injectable, Logger } from '@nestjs/common';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { TaskProgress } from './task-progress.enum';

export interface FlowStep {
  name: TaskProgress; // maps directly to progress stage
  handler: () => Promise<any>;
}

@Injectable()
export class FlowRunnerService {
  private readonly logger = new Logger(FlowRunnerService.name);

  constructor(private readonly localStorage: LocalStorageService) {}

  async run(taskId: string, steps: FlowStep[]): Promise<void> {
    for (const step of steps) {
      this.logger.log(`▶️ Running step: ${step.name}`);
      try {
        await step.handler();
        this.localStorage.saveProgress(taskId, step.name);
      } catch (err) {
        this.logger.error(`❌ Step "${step.name}" failed`, err);
        this.localStorage.saveProgress(taskId, TaskProgress.Failed);
        throw err;
      }
    }
    this.logger.log(`✅ Flow completed for task ${taskId}`);
  }
}
