import { z } from 'zod';

export const EchoAnalysisSchema = z.object({
  tasksCount: z.number(),
});

export type EchoAnalysis = z.infer<typeof EchoAnalysisSchema>;
