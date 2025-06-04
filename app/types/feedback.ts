export interface FeedbackRecord {
  id: string;
  message: string;
  email?: string;
  userId?: string;
  createdAt: Date;
}

