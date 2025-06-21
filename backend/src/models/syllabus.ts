import { z } from 'zod';

export const SyllabusMatchItemSchema = z.object({
  id: z.number(),
  reason: z.string(),
});

export const SyllabusMatchErrorSchema = z.object({
  error: z.string(),
  raw: z.string(),
});

export const SyllabusMappingResultSchema = z.object({
  task_title: z.string(),
  event_summary: z.string(),
  matched: z.union([
    z.array(SyllabusMatchItemSchema),
    SyllabusMatchErrorSchema,
  ]),
});

export const SyllabusMappingOutputSchema = z.array(SyllabusMappingResultSchema);

export type SyllabusMatchItem = z.infer<typeof SyllabusMatchItemSchema>;
export type SyllabusMappingResult = z.infer<typeof SyllabusMappingResultSchema>;
export type SyllabusMappingOutput = z.infer<typeof SyllabusMappingOutputSchema>;
