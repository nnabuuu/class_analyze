import { z } from 'zod';

export const SpeakerProbabilitiesSchema = z.object({
  teacher: z.number(),
  student: z.number(),
});

export const TranscriptSentenceSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
  speaker_probabilities: SpeakerProbabilitiesSchema,
});

export const TranscriptProcessingOutputSchema = z.array(
  TranscriptSentenceSchema,
);

export type SpeakerProbabilities = z.infer<typeof SpeakerProbabilitiesSchema>;
export type TranscriptSentence = z.infer<typeof TranscriptSentenceSchema>;
export type TranscriptProcessingOutput = z.infer<
  typeof TranscriptProcessingOutputSchema
>;
