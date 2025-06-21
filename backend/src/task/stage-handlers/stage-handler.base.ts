import { TaskStage } from '../task.types';
import type { TaskStageHandler } from './stage-handler.interface';
/**
 * Base class for all pipeline stage handlers.
 *
 * Concrete handlers such as `SyllabusMappingStageHandler` extend this class to
 * implement the TaskStageHandler interface. Dependency metadata is expressed
 * via the static {@link dependsOn} property so handlers can read output files
 * from other stages without relying on Nest's {@link ModuleRef} lookup at
 * runtime.
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

  constructor() {}

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
      const files = (dep as any).outputFiles as string[] | undefined;
      if (files) outputs.push(...files);
    }
    return outputs;
  }
}
