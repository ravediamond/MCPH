import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShareCrateParams } from "../config/schemas";
import { registerCratesShareTool } from "./crates_share";

/**
 * DEPRECATED: use crates_share instead. This forwards to crates_share
 * with password removed.
 */
export function registerCratesMakePublicTool(server: McpServer): void {
  server.registerTool(
    "crates_make_public",
    {
      title: "Make Crate Public",
      description: "Deprecated alias for crates_share",
      inputSchema: ShareCrateParams._def.schema._def.shape(),
    },
    async (args: any, extra: any) => {
      const { id } = args;
      // Forward to crates_share without a password
      const shareTool = server.getTool("crates_share");
      if (!shareTool) throw new Error("crates_share tool not registered");
      return shareTool.handler({ id, password: "" }, extra);
    },
  );
}
