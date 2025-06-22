import { z } from 'zod';

export const ClassInfoSchema = z.object({
  subject: z.string(),
  level: z.string(),
  knowledgePoints: z.array(z.string()),
  teachingObjectives: z.array(z.string()),
  curriculum: z.string(),
  confidence: z.number(),
});

export type ClassInfo = z.infer<typeof ClassInfoSchema>;
