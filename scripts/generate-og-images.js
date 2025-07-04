// This is a script to generate OpenGraph images
// Run with Node.js: node scripts/generate-og-images.js

const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

// Create directory if it doesn't exist
const ogDir = path.join(__dirname, "../public/og");
if (!fs.existsSync(ogDir)) {
  fs.mkdirSync(ogDir, { recursive: true });
}

// Generate the main OG image
async function generateMainOgImage() {
  // Create canvas
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  // Background gradient
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fef8f4");
  gradient.addColorStop(1, "#fff1e6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Draw border
  context.strokeStyle = "#ff7a32";
  context.lineWidth = 10;
  context.strokeRect(20, 20, width - 40, height - 40);

  // Draw title
  context.font = "bold 80px Arial";
  context.textAlign = "center";
  context.fillStyle = "#333333";
  context.fillText("MCPH", width / 2, 180);

  // Draw subtitle
  context.font = "bold 36px Arial";
  context.fillStyle = "#666666";
  context.fillText("AI Artifact Storage & Sharing System", width / 2, 250);

  // Draw tagline
  context.font = "30px Arial";
  context.fillStyle = "#666666";
  context.fillText("One link for every AI output", width / 2, 320);

  // Draw feature points
  context.font = "28px Arial";
  context.textAlign = "left";
  const features = [
    "✓ 10MB file uploads",
    "✓ Secure AES-256 encryption",
    "✓ API & CLI access",
    "✓ Share with any AI model",
  ];

  features.forEach((feature, index) => {
    context.fillText(feature, width / 2 - 200, 420 + index * 45);
  });

  // Draw rounded "crate" icon
  context.fillStyle = "#ff7a32";
  roundRect(context, width / 2 - 350, 380, 120, 120, 20, true);

  // Draw "crate" text inside icon
  context.font = "bold 28px Arial";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText("CRATE", width / 2 - 290, 450);

  // Export image
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(ogDir, "og-image.png"), buffer);
  console.log("Generated main OG image");

  // Also save as the default names expected in metadata.ts
  fs.writeFileSync(path.join(__dirname, "../public/og-image.png"), buffer);
  fs.writeFileSync(path.join(__dirname, "../public/twitter-image.png"), buffer);
  console.log("Copied to default locations");
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height,
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();

  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

// Run the generator
generateMainOgImage().catch(console.error);
