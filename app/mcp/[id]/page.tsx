import { Metadata } from 'next';
import { supabase } from 'lib/supabaseClient';
import { MCP } from 'types/mcp';
import MCPDetailClient from 'components/MCPDetailClient'; // Import the new client component
import { notFound } from 'next/navigation';
import { refreshReadmeIfNeeded } from 'services/githubService'; // Keep server-side functions here

// Define Props type for the page and generateMetadata
type Props = {
  params: { id: string };
};

// Generate metadata (Server-side)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const canonicalUrl = `${baseUrl}/mcp/${id}`;

  // Fetch minimal data needed for metadata (e.g., name, description)
  const { data: mcpData } = await supabase
    .from('mcps')
    .select('name, description')
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle to handle not found case gracefully

  return {
    title: `MCP Details - ${mcpData?.name || id}`,
    description: mcpData?.description || `Details for MCP ${id}`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Server Component Page
export default async function MCPDetailPage({ params }: Props) {
  const id = params.id;

  // Fetch initial MCP data on the server
  let initialMcp: MCP | null = null;
  let fetchError = null;

  try {
    const { data, error } = await supabase
      .from('mcps')
      .select('*')
      .eq('id', id)
      .single(); // Use single to enforce finding one record

    if (error) {
      if (error.code === 'PGRST116') { // Code for "Not found"
        console.log(`MCP not found for id: ${id}`);
        // Let notFound handle this
      } else {
        throw error; // Re-throw other errors
      }
    } else {
      initialMcp = data as unknown as MCP;

      // Optionally perform initial README refresh on the server
      // Note: This might increase server response time.
      // Consider if this is better done client-side or via a background job.
      try {
        const refreshedMcp = await refreshReadmeIfNeeded(initialMcp);
        if (refreshedMcp !== initialMcp) {
          initialMcp = refreshedMcp as unknown as MCP;
        }
      } catch (refreshError) {
        console.error('Error refreshing README on server:', refreshError);
        // Proceed with potentially stale README, client can refresh later if needed
      }

      // Note: View count increment is moved to the client component
      // to ensure it runs in the browser context.
    }
  } catch (error) {
    console.error('Error fetching MCP on server:', error);
    fetchError = error; // Store error to potentially display
    // Depending on the error, you might still want to render the client component
    // or show a specific error page.
  }

  // If MCP wasn't found by supabase.single(), trigger a 404
  if (!initialMcp && !fetchError) {
    notFound();
  }

  // Render the client component, passing initial data and ID
  // The client component will handle loading states if initialMcp is null due to fetchError
  return <MCPDetailClient initialMcp={initialMcp} mcpId={id} />;
}
