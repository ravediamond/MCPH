import dotenv from "dotenv";
import { startServer } from "./server";
import util from "util";

// Global error handlers for better diagnostics
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Unhandled Rejection at:",
    promise,
    "reason:",
    reason instanceof Error
      ? reason.stack || reason.message
      : util.inspect(reason, { depth: null }),
  );
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(
    "Uncaught Exception:",
    err instanceof Error
      ? err.stack || err.message
      : util.inspect(err, { depth: null }),
  );
  process.exit(1);
});

// Load environment variables
// Note: When running with npm run dev, this is loaded automatically through the -r dotenv/config flag
// This is here for the production build or direct node execution
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "../.env.local" });
} else {
  dotenv.config({ path: ".env.local" });
}

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
startServer(PORT);
