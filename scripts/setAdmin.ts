import { admin } from "../lib/firebaseAdmin.js"; // Adjust path as needed

async function setAdminClaimForUser(uid: string) {
  if (!uid) {
    console.error("Error: UID is required. Usage: npm run set-admin <UID>");
    process.exit(1);
  }

  try {
    // Firebase Admin is initialized on import
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Successfully set admin claim for user: ${uid}`);
    console.log(
      "The user may need to sign out and sign back in, or their ID token refreshed, for the changes to take effect immediately on the client-side."
    );
    process.exit(0);
  } catch (error) {
    console.error("Error setting custom claim:", error);
    process.exit(1);
  }
}

// Get UID from command line arguments
const uid = process.argv[2];
setAdminClaimForUser(uid);
