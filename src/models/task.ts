import { z } from 'zod';
import { TranscriptSentenceSchema } from './transcript';

export const TaskEventSchema = z.object({
  event_type: z.string(),
  summary: z.string(),
  sentences: z.array(TranscriptSentenceSchema),
});

export const TaskSchema = z.object({
  task_title: z.string(),
  summary: z.string().optional(),
  events: z.array(TaskEventSchema),
});

export const TaskEventAnalyzeOutputSchema = z.array(TaskSchema);

export type TaskEvent = z.infer<typeof TaskEventSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskEventAnalyzeOutput = z.infer<
  typeof TaskEventAnalyzeOutputSchema
>;
