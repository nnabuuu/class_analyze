export type TaskStage =
  | 'initializing'
  | 'awaiting_processing'
  | 'chunking'
  | 'calling_llm'
  | 'parsing'
  | 'generating_report'
  | 'done'
  | 'error';

export interface TaskStatus {
  status: 'created' | 'queued' | 'processing' | 'completed' | 'failed';
  stage: TaskStage;
  progress: number;
  message?: string;
}
