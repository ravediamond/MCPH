export interface MCP {
  id?: string;
  created_at?: string;
  name: string;
  description?: string;
  repository_url: string;
  repository_name?: string;  // New field for repository name
  tags?: string[];
  version: string;
  author: string;
  user_id: string;
  readme?: string;         // Cached README content
  last_refreshed?: string; // Timestamp when the README was fetched
  owner_username?: string; // Owner's GitHub username
  claimed?: boolean;       // Whether the MCP has been claimed by its owner
  is_mcph_owned?: boolean; // Whether the MCP is owned by MCPH (organization ownership)
  view_count?: number;     // Number of times this MCP has been viewed
  avg_rating?: number;     // Average rating (1-5)
  review_count?: number;   // Number of reviews
  stars?: number;          // GitHub repository star count
  forks?: number;          // GitHub repository fork count
  open_issues?: number;    // GitHub repository open issues count
  last_repo_update?: string; // Last GitHub repository update timestamp
  profiles?: {             // Added profiles property for join data
    email: string;
  };
}

// Interface for version history entries
export interface MCPVersion {
  id?: string;
  created_at?: string;
  mcp_id: string;
  version: string;
  change_summary?: string;
  change_details?: string;
  changed_by?: string;
  user?: {
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