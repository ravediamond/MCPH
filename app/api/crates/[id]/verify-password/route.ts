import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata } from "@/services/firebaseService";
import crypto from "crypto";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { password } = await req.json();
        const crateId = params.id;

        if (!password) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 },
            );
        }

        const crate = await getCrateMetadata(crateId);

        if (!crate) {
            return NextResponse.json({ error: "Crate not found" }, { status: 404 });
        }

        if (!crate.shared.passwordProtected) {
            // Should not happen if UI is correct, but good to check
            return NextResponse.json(
                { error: "Crate is not password protected" },
                { status: 400 },
            );
        }

        if (!crate.shared.passwordHash || !crate.shared.passwordSalt) {
            console.error(
                `Crate ${crateId} is password protected but missing hash or salt.`,
            );
            return NextResponse.json(
                { error: "Password data is missing for this crate" },
                { status: 500 },
            );
        }

        const currentHash = crypto
            .pbkdf2Sync(
                password,
                crate.shared.passwordSalt,
                1000,
                64,
                "sha512",
            )
            .toString("hex");

        if (currentHash === crate.shared.passwordHash) {
            // Passwords match
            // In a real scenario, you might issue a short-lived token here
            // for the client to use for the actual download/access.
            // For now, just confirming verification.
            return NextResponse.json({ success: true, message: "Password verified" });
        } else {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 },
            );
        }
    } catch (error: any) {
        console.error("Error verifying password:", error);
        return NextResponse.json(
            { error: "Failed to verify password", message: error.message },
            { status: 500 },
        );
    }
}