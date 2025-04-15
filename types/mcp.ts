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