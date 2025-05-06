export interface MCP {
  id?: string;
  created_at?: string;
  updated_at?: string | null; // Added for sitemap generation
  name: string;
  description?: string;
  repository_url: string;
  repository_name?: string | null;  // Updated to accept null values
  tags?: string[];    // Removed null since it's causing type issues with Supabase
  author: string;
  user_id: string;
  readme?: string | null;         // Updated to accept null values
  last_refreshed?: string | null; // Updated to accept null values
  owner_username?: string | null; // Updated to accept null values
  claimed?: boolean | null;       // Updated to accept null values
  is_mcph_owned?: boolean | null; // Updated to accept null values
  view_count?: number | null;     // Updated to accept null values
  avg_rating?: number | null;     // Updated to accept null values
  review_count?: number | null;   // Updated to accept null values
  stars?: number | null;          // GitHub repository star count, updated to accept null
  forks?: number | null;          // GitHub repository fork count, updated to accept null
  open_issues?: number | null;    // GitHub repository open issues count, updated to accept null
  last_repo_update?: string | null; // Updated to accept null values
  languages?: string[];    // Programming languages used in the repository
  default_branch?: string | null; // Add the default branch property
  profiles?: {             // Updated profiles property to include username
    email?: string;
    username?: string;
    id?: string;
  };
}

// Interface for reviews
export interface Review {
  id?: string;
  created_at?: string;
  updated_at?: string;
  mcp_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  user?: {
    email: string;
    username?: string;
  };
}

// Interface for submitting a new review
export interface ReviewSubmission {
  mcp_id: string;
  rating: number;
  comment?: string;
}

// Interface for review statistics
export interface ReviewStats {
  avg_rating: number;
  review_count: number;
  rating_distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  }
}