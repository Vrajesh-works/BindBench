import { z } from "zod";

const uuid = z.string().uuid("must be a valid UUID");

/** POST /api/projects */
export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(200),
    description: z.string().trim().max(2000).nullish(),
    targetId: uuid.optional(),
    target: z
      .object({
        name: z.string().trim().min(1, "target name is required").max(200),
        uniprotId: z.string().trim().max(50).nullish(),
        sequence: z.string().trim().min(1, "target sequence is required").max(20000),
      })
      .optional(),
  })
  .refine((d) => d.targetId || d.target, {
    message: "provide targetId or target { name, sequence }",
  });

/** POST /api/compounds */
export const createCompoundsSchema = z.object({
  compounds: z
    .array(
      z.object({
        name: z.string().trim().min(1, "compound name is required").max(200),
        smiles: z.string().trim().min(1, "smiles is required").max(5000),
        source: z.string().trim().max(200).nullish(),
      })
    )
    .min(1, "compounds[] must not be empty")
    .max(5000, "at most 5000 compounds per request"),
});

/** POST /api/screens/start */
export const startScreenSchema = z.object({
  projectId: uuid,
  compoundIds: z
    .array(uuid)
    .min(1, "compoundIds[] must not be empty")
    .max(1000, "at most 1000 compounds per screen"),
});

/** GET /api/results */
export const resultsQuerySchema = z
  .object({
    projectId: uuid.optional(),
    screenId: uuid.optional(),
  })
  .refine((d) => d.projectId || d.screenId, {
    message: "projectId or screenId is required",
  });

/** Consistent 400 payload for validation failures. */
export function validationError(message: string, issues: z.ZodIssue[]) {
  return {
    error: message,
    details: issues.map((i) => ({
      path: i.path.join(".") || "(body)",
      message: i.message,
    })),
  };
}
