import { logEvent } from "./firebaseService";
import { getCrateMetadata } from "../lib/services";

export async function incrementCrateDownloadCount(
  crateId: string,
): Promise<void> {
  try {
    // Increment download count in the metadata store using the increment flag in getCrateMetadata
    await getCrateMetadata(crateId, true);

    // Log the download event
    await logEvent("file_download", crateId);
  } catch (error) {
    console.error("Error tracking download:", error);
  }
}
