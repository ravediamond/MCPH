import { z } from "zod";
import { CrateCategory } from "../../../shared/types/crate";

// Zod schemas for tool arguments
export const ListCratesParams = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  startAfter: z.string().optional(),
});

export const GetCrateParams = z.object({
  id: z.string(),
  password: z.string().optional(),
});

export const GetCrateDownloadLinkParams = z.object({
  id: z.string(),
  expiresInSeconds: z.number().int().min(1).max(86400).optional(),
});

export const GoogleOAuthParams = z.object({
  scope: z.string().optional().default("profile email"),
  state: z.string().optional(),
  redirectUri: z.string().optional(),
});

export const UploadCrateParams = z
  .object({
    fileName: z.string(),
    contentType: z.string(),
    data: z.string().optional(), // base64-encoded if present
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.nativeEnum(CrateCategory).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    isPublic: z.boolean().optional().default(false),
    password: z.string().optional(),
  })
  .refine((data) => !(data.isPublic && data.password), {
    message: "A crate cannot be both public and password-protected",
    path: ["isPublic", "password"],
  });

export const ShareCrateParams = z.object({
  id: z.string(),
  password: z.string().optional(),
});

export const UnshareCrateParams = z.object({
  id: z.string(),
});

export const DeleteCrateParams = z.object({
  id: z.string(),
});

export const SearchParams = z.object({
  query: z.string(),
});
