/**
 * MetadataStore module for handling file metadata in Firestore
 * Responsible for saving, reading, and updating metadata
 */
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Crate } from "../../shared/types/crate.js";

// Import the existing Firebase admin properly to prevent circular dependencies
import { firestore } from "../firebaseAdmin.js";

// Collection name for crates in Firestore
const CRATES_COLLECTION = "crates";

// Use the already initialized Firestore instance
const db = firestore;

// Helper to convert data for Firestore (removes undefined values)
const toFirestoreData = (data: any): any => {
  const result = { ...data };

  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (result[key] instanceof Date) {
      // Dates are handled automatically by Firestore
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = toFirestoreData(result[key]);
    }
  });

  return result;
};

// Helper to convert data from Firestore (converts Timestamps to Date objects)
const fromFirestoreData = (data: any): any => {
  if (!data) return null;

  const result = { ...data };

  Object.keys(result).forEach((key) => {
    if (result[key] && typeof result[key].toDate === "function") {
      result[key] = result[key].toDate();
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = fromFirestoreData(result[key]);
    }
  });

  return result;
};

/**
 * Save or update crate metadata in Firestore
 * @param crateData - The crate metadata to save
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function saveCrateMetadata(crateData: Crate): Promise<boolean> {
  try {
    const dataToSave = toFirestoreData({
      ...crateData,
    });

    await db.collection(CRATES_COLLECTION).doc(crateData.id).set(dataToSave);

    return true;
  } catch (error) {
    console.error("Error saving crate metadata to Firestore:", error);
    return false;
  }
}

/**
 * Get crate metadata and optionally increment download count in a single operation
 * @param crateId - The ID of the crate to retrieve
 * @param incrementDownloads - Whether to increment the download count (default: false)
 * @returns Promise resolving to the crate metadata or null if not found
 */
export async function getCrateMetadata(
  crateId: string,
  incrementDownloads: boolean = false,
): Promise<Crate | null> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);

    // If increment flag is true, perform an atomic update before getting the document
    if (incrementDownloads) {
      try {
        await docRef.update({
          downloadCount: FieldValue.increment(1),
        });
      } catch (updateError) {
        console.warn(
          `Failed to increment download count for crate ${crateId}:`,
          updateError,
        );
      }
    }

    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return fromFirestoreData(data) as Crate;
  } catch (error) {
    console.error("Error getting crate metadata from Firestore:", error);
    return null;
  }
}
