import "server-only";
import { z } from "zod";
import { UserRoleSchema } from "./permissions";

export const PositiveIntSchema = z.coerce.number().int().positive();

export const CreateUserInputSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(8).max(128),
  role: UserRoleSchema.optional().default("HR"),
});

export const UpdateUserInputSchema = z.object({
  userId: PositiveIntSchema,
  isActive: z.boolean().optional(),
  role: z.string().trim().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.union([z.string(), z.null()]).optional(),
  newPassword: z.string().optional(),
});

export const ApproveJobInputSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]).default("APPROVE"),
  approvalNote: z.string().trim().optional().default(""),
});

export const TriggerN8nInputSchema = z
  .object({
    applicationId: PositiveIntSchema,
  })
  .strict();

export const CleanupTalentPoolInputSchema = z.object({
  days: z.number().int().min(0).max(3650).default(180),
  dryRun: z.boolean().default(false),
});

export const RepoolCandidateInputSchema = z.object({
  candidateId: PositiveIntSchema,
  targetJobId: PositiveIntSchema,
});
