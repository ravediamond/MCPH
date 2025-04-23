export interface MCP {
  id?: string;
  created_at?: string;
  name: string;
  description?: string;
  repository_url: string;
  repository_name?: string | null;  // Updated to accept null values
  tags?: string[];
  author: string;
  user_id: string;
  readme?: string | null;         // Updated to accept null values
  last_refreshed?: string | null; // Updated to accept null values
  owner_username?: string | null; // Updated to accept null values
  claimed?: boolean | null;       // Updated to accept null values
  is_mcph_owned?: boolean | null; // Updated to accept null values
  view_count?: number;     // Number of times this MCP has been viewed
  avg_rating?: number;     // Average rating (1-5)
  review_count?: number;   // Number of reviews
  stars?: number;          // GitHub repository star count
  forks?: number;          // GitHub repository fork count
  open_issues?: number;    // GitHub repository open issues count
  last_repo_update?: string | null; // Updated to accept null values
  languages?: string[];    // Programming languages used in the repository
  profiles?: {             // Added profiles property for join data
    email: string;
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