import { z } from "zod";
import { BoardRole } from "../types/enums";

export const createBoardSchema = z.object({
  title: z.string().trim().min(1, "Board title is required").max(120),
});

export const updateBoardSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const boardRoleSchema = z.nativeEnum(BoardRole);

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
