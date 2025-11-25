import sharp from 'sharp';
import path from 'path';

async function createPlaceholder() {
  const width = 1080;
  const height = 1080;

  // Create SVG with placeholder text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1f2937"/>
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#4b5563" stroke-width="4" stroke-dasharray="20,10"/>
      <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#6b7280">IMAGE</text>
      <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#6b7280">PLACEHOLDER</text>
      <text x="50%" y="75%" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#4b5563">Generate image in next step</text>
    </svg>
  `;

  const outputPath = path.join(__dirname, '../public/images/placeholder-post.png');

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log('Created placeholder image:', outputPath);
}

createPlaceholder();
