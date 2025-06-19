import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hybrid Search Documentation",
  description:
    "Learn about the powerful hybrid search capabilities of MCP Hub, combining keyword and semantic search for optimal results.",
};

const HybridSearchPage = () => {
  return (
    <article className="prose dark:prose-invert">
      <h1>Hybrid Search</h1>
      <p>
        MCP Hub employs a sophisticated hybrid search algorithm. This approach
        melds the precision of traditional keyword-based search with the
        contextual understanding of semantic search. The result is a more
        intuitive and powerful search experience that better understands your
        intent and delivers more relevant results.
      </p>

      <h2>CLI Example</h2>
      <p>
        To search for crates via the command line, you can use the following
        format. For instance, to find crates related to "project roadmap", you
        would run:
      </p>
      <pre>
        <code>search crates "project roadmap"</code>
      </pre>
    </article>
  );
};

export default HybridSearchPage;
