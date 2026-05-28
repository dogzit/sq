// Run: npx tsx scripts/generate-icons.ts
// Creates PNG icons from SVG for PWA manifest

import { writeFileSync } from "fs";

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a3e;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="220" text-anchor="middle" font-family="monospace" font-size="160" font-weight="bold" fill="#00f0ff" filter="url(#glow)">SQ</text>
  <text x="256" y="360" text-anchor="middle" font-family="monospace" font-size="48" fill="#ff00e5" filter="url(#glow)">QUEST</text>
  <rect x="80" y="400" width="352" height="4" rx="2" fill="#00f0ff" opacity="0.5"/>
  <circle cx="120" cy="440" r="6" fill="#39ff14" opacity="0.8"/>
  <circle cx="256" cy="440" r="6" fill="#00f0ff" opacity="0.8"/>
  <circle cx="392" cy="440" r="6" fill="#ff00e5" opacity="0.8"/>
</svg>`;

// Write SVG versions
writeFileSync("public/icons/icon.svg", svgIcon);
writeFileSync("public/icon.svg", svgIcon);

console.log("SVG icons generated. For PNG conversion, use:");
console.log("  npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192");
console.log("  npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512");
console.log("");
console.log("Or use https://realfavicongenerator.net with the SVG file.");
