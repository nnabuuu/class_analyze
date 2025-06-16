import { TaskStage } from '../task.types';

export interface TaskStageHandler {
  readonly stage: TaskStage;
  handle(taskId: string): Promise<void>;
}
