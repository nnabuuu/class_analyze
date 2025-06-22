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

export const STAGE_LABELS: Record<TaskStage, string> = {
  initializing: 'File Processing',
  transcript_preprocessing: 'File Processing',
  'task-event-analyze': 'Task Segmentation',
  syllabus_mapping: 'Class Information Detection',
  deep_analyze: 'BLOOM Taxonomy Analysis',
  report_generation: 'Report Generation',
  done: 'Completed',
  error: 'Error',
};
