import { z } from "zod";
import { CrateCategory } from "../../../shared/types/crate";
import { FeedbackFieldType } from "../../../shared/types/feedback";

// Zod schemas for tool arguments
export const ListCratesParams = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  startAfter: z.string().optional(),
});

export const GetCrateParams = z.object({
  id: z.string(),
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

const UploadCrateBaseParams = z.object({
  fileName: z.string().optional(),
  contentType: z.string(),
  data: z.string().optional(), // base64-encoded if present
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.nativeEnum(CrateCategory).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
});

export const UploadCrateParams = UploadCrateBaseParams;

export const UploadCrateParamsShape = UploadCrateBaseParams;

export const ShareCrateParams = z.object({
  id: z.string(),
  editKey: z.string(),
});

export const UnshareCrateParams = z.object({
  id: z.string(),
  editKey: z.string(),
});

export const DeleteCrateParams = z.object({
  id: z.string(),
  editKey: z.string(),
});

export const CopyCrateParams = z.object({
  id: z.string(),
});

export const SearchParams = z.object({
  query: z.string(),
  category: z.nativeEnum(CrateCategory).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const UpdateCrateParams = z.object({
  id: z.string(),
  editKey: z.string(), // Required for edit access
  title: z.string().optional(),
  description: z.string().optional(),
  data: z.string().optional(), // base64-encoded if present
  fileName: z.string().optional(),
  contentType: z.string().optional(),
  category: z.nativeEnum(CrateCategory).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// Feedback schemas
export const FeedbackFieldSchema = z.object({
  key: z.string().min(1),
  type: z.nativeEnum(FeedbackFieldType),
  label: z.string().min(1),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  placeholder: z.string().optional(),
});

export const CreateFeedbackTemplateParams = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FeedbackFieldSchema).min(1),
  isPublic: z.boolean().optional().default(false),
  linkedCrates: z.array(z.string()).optional(),
});

export const SubmitFeedbackParams = z.object({
  templateId: z.string(),
  responses: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const GetFeedbackResponsesParams = z.object({
  templateId: z.string(),
  limit: z.number().int().min(1).max(100).optional(),
  startAfter: z.string().optional(),
});
