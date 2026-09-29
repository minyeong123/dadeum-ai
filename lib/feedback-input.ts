import { z } from "zod";

export const ESSAY_MAX_LENGTH = 5000;

export const feedbackInputSchema = z.object({
  essay: z
    .string()
    .trim()
    .min(1, "자기소개서를 입력해주세요.")
    .max(
      ESSAY_MAX_LENGTH,
      `자기소개서는 ${ESSAY_MAX_LENGTH.toLocaleString()}자 이하로 입력해주세요.`,
    ),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
