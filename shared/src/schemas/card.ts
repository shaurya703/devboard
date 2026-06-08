import { z } from "zod";

/** Accepts an ISO date string or null; coerces "" → null. */
const nullableDate = z
  .union([z.string().datetime({ offset: true }), z.null()])
  .optional();

export const createCardSchema = z.object({
  title: z.string().trim().min(1, "Card title is required").max(200),
  description: z.string().max(5000).optional(),
  dueDate: nullableDate,
  assigneeId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateCardSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  dueDate: nullableDate,
  assigneeId: z.string().uuid().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

/**
 * Move a card to a (possibly different) column at a target position.
 * Position is a fractional index so reorders touch a single row.
 */
export const moveCardSchema = z.object({
  toColumnId: z.string().uuid(),
  position: z.number().finite(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;

// --- Labels ---
export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a hex value like #3b82f6"),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
