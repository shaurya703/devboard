import { z } from "zod";
import { emailSchema } from "./auth";
import { BoardRole } from "../types/enums";

/** Roles assignable to an invited member (owner is implicit, not invitable). */
export const assignableRoleSchema = z.enum([BoardRole.EDITOR, BoardRole.VIEWER]);

export const createInviteSchema = z.object({
  email: emailSchema,
  role: assignableRoleSchema.default(BoardRole.EDITOR),
});

export const updateMemberRoleSchema = z.object({
  role: assignableRoleSchema,
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
