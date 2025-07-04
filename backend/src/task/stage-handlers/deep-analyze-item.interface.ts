import type { StageHandlerCtor } from './stage-handler.base';

export interface DeepAnalyzeItem {
  /** Human readable name */
  readonly name: string;
  /**
   * Handler class whose output this item depends on
   * so that dependencies are type-safe.
   */
  readonly dependsOn?: StageHandlerCtor[];
  /** Files generated by this item */
  readonly outputFiles: string[];
  analyze(taskId: string): Promise<void>;
}
