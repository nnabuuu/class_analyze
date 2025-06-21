import { ModuleRef } from '@nestjs/core';
import { TaskStage } from '../task.types';
import type { TaskStageHandler } from './stage-handler.interface';
/**
 * Base class for all pipeline stage handlers.
 *
 * Concrete handlers such as `SyllabusMappingStageHandler` extend this class to
 * implement the TaskStageHandler interface. A {@link ModuleRef} instance is
 * injected so subclasses can look up other stage handlers at runtime based on
 * their class types declared in {@link dependsOn}.
 *
 * Stage metadata like {@link stage}, {@link outputFiles} and {@link dependsOn}
 * are defined as static properties so they can be read without creating an
 * instance. Instances expose the same information via getters to satisfy the
 * {@link TaskStageHandler} interface.
 */

export type StageHandlerCtor<T extends TaskStageHandler = TaskStageHandler> =
  new (...args: any[]) => T;

export abstract class StageHandlerBase implements TaskStageHandler {
  static stage: TaskStage;
  static outputFiles?: string[];
  static dependsOn?: StageHandlerCtor[];

  constructor(protected readonly moduleRef: ModuleRef) {}

  get stage(): TaskStage {
    return (this.constructor as typeof StageHandlerBase).stage;
  }

  get outputFiles(): string[] | undefined {
    return (this.constructor as typeof StageHandlerBase).outputFiles;
  }

  get dependsOn(): StageHandlerCtor[] | undefined {
    return (this.constructor as typeof StageHandlerBase).dependsOn;
  }

  abstract handle(taskId: string): Promise<void>;

  /**
   * Return the output file paths for this handler's dependencies as
   * declared via {@link dependsOn}.
   */
  protected getStageOutputs(): string[] {
    return this.resolveOutputs(this.dependsOn);
  }

  protected resolveOutputs(
    stages?: StageHandlerCtor | StageHandlerCtor[],
  ): string[] {
    if (!stages) return [];
    const deps = Array.isArray(stages) ? stages : [stages];
    const outputs: string[] = [];
    for (const dep of deps) {
      const handler = this.moduleRef.get(dep, { strict: false });
      if (handler?.outputFiles) outputs.push(...handler.outputFiles);
    }
    return outputs;
  }
}
