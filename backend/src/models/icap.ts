import { z } from 'zod';

export const ICAPModeEnum = z.enum([
  'Passive',
  'Active',
  'Constructive',
  'Interactive',
]);

export const ICAPResultSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
  ICAP_mode: ICAPModeEnum,
  reasoning: z.string(),
  confidence: z.number(),
});

export const ICAPAnalysisSchema = z.array(ICAPResultSchema);

export type ICAPResult = z.infer<typeof ICAPResultSchema>;
export type ICAPAnalysis = z.infer<typeof ICAPAnalysisSchema>;
