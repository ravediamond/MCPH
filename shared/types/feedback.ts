export enum FeedbackFieldType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  SELECT = "select",
  MULTISELECT = "multiselect",
  RATING = "rating",
}

export interface FeedbackField {
  key: string;
  type: FeedbackFieldType;
  label: string;
  required: boolean;
  options?: string[]; // for select/multiselect
  minValue?: number; // for rating/number
  maxValue?: number; // for rating/number
  placeholder?: string; // for text fields
}

export interface FeedbackTemplate {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  fields: FeedbackField[];
  isPublic: boolean;
  tags?: string[];
  submissionCount: number;
  linkedCrates?: string[]; // Array of crate IDs this feedback is about
  isOpen: boolean; // Whether the template is accepting responses
  closedAt?: Date; // When the template was closed
}

export interface FeedbackResponse {
  id: string;
  templateId: string;
  submitterId?: string; // optional for anonymous
  submittedAt: Date;
  responses: Record<string, any>;
  metadata?: Record<string, string>;
}
