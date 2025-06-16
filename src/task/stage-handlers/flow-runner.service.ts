import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaskStage } from '../task.types';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TaskStageHandler } from './stage-handler.interface';

export interface FlowStep {
  name: TaskStage;
}
@Injectable()
export class FlowRunnerService {
  private readonly logger = new Logger(FlowRunnerService.name);

  constructor(
    private readonly localStorage: LocalStorageService,
    @Inject('TASK_STAGE_HANDLERS')
    private readonly handlers: TaskStageHandler[],
  ) {}

  async run(taskId: string, steps: FlowStep[]): Promise<void> {
    for (const step of steps) {
      this.logger.log(`▶️ Running step: ${step.name}`);

      const handler = this.handlers.find((h) => h.stage === step.name);
      if (!handler) {
        this.logger.error(`❌ No handler found for stage: ${step.name}`);
        this.localStorage.saveProgress(
          taskId,
          'error',
          1,
          `Missing handler: ${step.name}`,
        );
        throw new Error(`Missing handler: ${step.name}`);
      }

      try {
        this.localStorage.saveProgress(taskId, step.name, undefined, 'Started');
        await handler.handle(taskId);
        this.localStorage.saveProgress(taskId, step.name);
      } catch (err) {
        this.logger.error(`❌ Step "${step.name}" failed:`, err);
        this.localStorage.saveProgress(taskId, 'error', 1, err.message);
        throw err;
      }
    }

    this.logger.log(`✅ Flow completed for task ${taskId}`);
  }
}
