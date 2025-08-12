export enum FeedbackFieldType {
  TEXT = "text",
  TEXTAREA = "textarea",
  NUMBER = "number",
  SELECT = "select",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  RATING = "rating",
  EMAIL = "email",
  URL = "url",
  DATE = "date",
  TIME = "time",
  DATETIME = "datetime",
  BOOLEAN = "boolean",
}

export interface FeedbackField {
  key: string;
  type: FeedbackFieldType;
  label: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
  description?: string;
}

export interface FeedbackTemplate {
  id: string;
  title: string;
  description?: string;
  fields: FeedbackField[];
  isPublic: boolean;
  tags?: string[];
  linkedCrates?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface FeedbackResponse {
  id: string;
  templateId: string;
  responses: Record<string, any>;
  metadata?: Record<string, string>;
  submittedBy?: string;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface FeedbackStats {
  templateId: string;
  totalResponses: number;
  averageRating?: number;
  responseRate: number;
  completionRate: number;
  lastResponseAt?: Date;
}
