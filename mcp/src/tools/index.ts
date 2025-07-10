import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCratesListTool } from "./crates_list";
import { registerCratesGetTool } from "./crates_get";
import { registerCratesGetDownloadLinkTool } from "./crates_get_download_link";
import { registerCratesSearchTool } from "./crates_search";
import { registerCratesUploadTool } from "./crates_upload";
import { registerCratesShareTool } from "./crates_share";
import { registerCratesMakePublicTool } from "./crates_make_public";
import { registerCratesUnshareTool } from "./crates_unshare";
import { registerCratesDeleteTool } from "./crates_delete";
import { registerCratesCopyTool } from "./crates_copy";
import { registerCratesUpdateTool } from "./crates_update";
import { registerFeedbackTemplateCreateTool } from "./feedback_template_create";
import { registerFeedbackSubmitTool } from "./feedback_submit";
import { registerFeedbackResponsesGetTool } from "./feedback_responses_get";
import { registerCratesGalleryTool } from "./crates_gallery";
import { registerCratesShareSocialTool } from "./crates_share_social";

/**
 * Register all tools with the provided MCP server
 */
export function registerAllTools(server: McpServer): void {
  registerCratesListTool(server);
  registerCratesGetTool(server);
  registerCratesGetDownloadLinkTool(server);
  registerCratesSearchTool(server);
  registerCratesUploadTool(server);
  registerCratesShareTool(server);
  registerCratesMakePublicTool(server);
  registerCratesUnshareTool(server);
  registerCratesDeleteTool(server);
  registerCratesCopyTool(server);
  registerCratesUpdateTool(server);
  registerFeedbackTemplateCreateTool(server);
  registerFeedbackSubmitTool(server);
  registerFeedbackResponsesGetTool(server);
  registerCratesGalleryTool(server);
  registerCratesShareSocialTool(server);
}
