import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { admin } from "../../../../../lib/firebaseAdmin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await the params promise to get the actual id value
    const { id } = await params;
    const crateId = id;
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Check if the crate exists
    const crateRef = firestore.collection("crates").doc(crateId);
    const crateDoc = await crateRef.get();

    if (!crateDoc.exists) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Get crate data to find associated storage files
    const crateData = crateDoc.data();

    // Delete the file from storage if it exists
    if (crateData?.storagePath) {
      try {
        const bucket = getStorage().bucket();
        await bucket.file(crateData.storagePath).delete();
      } catch (storageError) {
        console.error(`Error deleting file from storage: ${storageError}`);
        // Continue with deletion even if storage deletion fails
      }
    }

    // Delete any associated documents (e.g., comments, likes, etc.)
    try {
      // Example: Delete related comments
      const commentsQuery = await firestore
        .collection("comments")
        .where("crateId", "==", crateId)
        .get();

      const batch = firestore.batch();
      commentsQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Execute the batch if there are documents to delete
      if (commentsQuery.docs.length > 0) {
        await batch.commit();
      }
    } catch (relatedDocsError) {
      console.error(`Error deleting related documents: ${relatedDocsError}`);
      // Continue with crate deletion even if related docs deletion fails
    }

    // Finally, delete the crate document from Firestore
    await crateRef.delete();

    return NextResponse.json({
      success: true,
      message: "Crate deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting crate:", error);

    if (
      error.code === "auth/id-token-expired" ||
      error.code === "auth/argument-error"
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
