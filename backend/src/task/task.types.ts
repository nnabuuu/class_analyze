export type TaskStage =
  | 'initializing'
  | 'transcript_preprocessing'
  | 'task-event-analyze'
  | 'syllabus_mapping'
  | 'deep_analyze'
  | 'report_generation'
  | 'done'
  | 'error';

export interface TaskStatus {
  status: 'created' | 'queued' | 'processing' | 'completed' | 'failed';
  stage: TaskStage;
  progress: number;
  message?: string;
}
