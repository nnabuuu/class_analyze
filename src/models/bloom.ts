import { z } from 'zod';

export const BloomLevelEnum = z.enum([
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]);

export const BloomEventResultSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
  bloom_level: BloomLevelEnum,
  reasoning: z.string(),
  confidence: z.number(),
});

export const BloomTaskSummarySchema = z.object({
  task_title: z.string(),
  summary: z.string(),
  predominant_level: BloomLevelEnum,
});

export const BloomOverallSummarySchema = z.object({
  overall_summary: z.string(),
  predominant_level: BloomLevelEnum,
});

export const BloomAnalysisSchema = z.object({
  eventResults: z.array(BloomEventResultSchema),
  taskSummaries: z.array(BloomTaskSummarySchema),
  overall: BloomOverallSummarySchema.nullable(),
});

export type BloomEventResult = z.infer<typeof BloomEventResultSchema>;
export type BloomTaskSummary = z.infer<typeof BloomTaskSummarySchema>;
export type BloomOverallSummary = z.infer<typeof BloomOverallSummarySchema>;
export type BloomAnalysis = z.infer<typeof BloomAnalysisSchema>;
