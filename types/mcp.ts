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
}