import { Inject, Optional, forwardRef } from '@nestjs/common';
import { TaskStage } from '../task.types';
import { TaskStageHandler } from './stage-handler.interface';

export abstract class StageHandlerBase implements TaskStageHandler {
  abstract readonly stage: TaskStage;
  readonly outputFiles?: string[];
  readonly dependsOn?: Array<new (...args: any[]) => TaskStageHandler>;

  constructor(
    @Inject(forwardRef(() => 'TASK_STAGE_HANDLERS'))
    @Optional()
    protected readonly handlers: TaskStageHandler[] = [],
  ) {}

  abstract handle(taskId: string): Promise<void>;

  protected getStageOutputs(
    stages?:
      | (new (...args: any[]) => TaskStageHandler)
      | Array<new (...args: any[]) => TaskStageHandler>,
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
