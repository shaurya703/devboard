import { z } from "zod";

export const createColumnSchema = z.object({
  title: z.string().trim().min(1, "Column title is required").max(80),
});

export const updateColumnSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  position: z.number().finite().optional(),
});

/** Reorder a column to a new position among its siblings. */
export const reorderColumnSchema = z.object({
  position: z.number().finite(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type ReorderColumnInput = z.infer<typeof reorderColumnSchema>;
