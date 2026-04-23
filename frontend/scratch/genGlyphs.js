import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enginePath = path.resolve(__dirname, '../src/starweave/engines/glyphEngine.js');
let content = fs.readFileSync(enginePath, 'utf8');

const newGlyphs = [
  { char: '1', name: 'Monolith', hue: 20 },
  { char: '2', name: 'Zweige', hue: 50 },
  { char: '4', name: 'Quartite', hue: 80 },
  { char: '5', name: 'Pentus', hue: 110 },
  { char: '7', name: 'Heptar', hue: 140 },
  { char: '8', name: 'Octis', hue: 170 },
  { char: '9', name: 'Novus', hue: 200 },
  
  { char: 'B', name: 'Beta', hue: 230 },
  { char: 'C', name: 'Crescent', hue: 260 },
  { char: 'D', name: 'Delta', hue: 290 },
  { char: 'E', name: 'Epsilon', hue: 320 },
  { char: 'F', name: 'Phi', hue: 350 },
  { char: 'G', name: 'Gamma', hue: 15 },
  { char: 'H', name: 'Helix', hue: 45 },
  { char: 'J', name: 'Jotun', hue: 75 },
  { char: 'L', name: 'Lambda', hue: 105 },
  { char: 'M', name: 'Mu', hue: 135 },
  { char: 'N', name: 'Nu', hue: 165 },
  { char: 'Q', name: 'Quasar', hue: 195 },
  { char: 'R', name: 'Rho', hue: 225 },
  { char: 'T', name: 'Tau', hue: 255 },
  { char: 'U', name: 'Upsilon', hue: 285 },
  { char: 'W', name: 'Omega', hue: 315 },
  { char: 'Y', name: 'Ypsilon', hue: 345 },
  { char: 'Z', name: 'Zeta', hue: 60 }
];

function stringHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

let added = '';
newGlyphs.forEach((g, i) => {
  const bx = (0.15 + (Math.random() * 0.70)).toFixed(2);
  const by = (0.15 + (Math.random() * 0.70)).toFixed(2);
  
  const hash = stringHash(g.name);
  const r1 = (((hash % 100) / 100) * 0.8 - 0.4).toFixed(3);
  const r2 = ((((hash >> 4) % 100) / 100) * 0.8 - 0.4).toFixed(3);
  const r3 = ((((hash >> 8) % 100) / 100) * 0.8 - 0.4).toFixed(3);

  const drawCode = 
      "      const s = R * 0.55;\n" +
      "      ctx.lineWidth = 2;\n" +
      "      ctx.lineCap = 'round';\n" +
      "      ctx.lineJoin = 'round';\n" +
      "      ctx.beginPath();\n" +
      "      ctx.moveTo(-s * 0.5, s * " + r1 + ");\n" +
      "      ctx.lineTo(s * " + r2 + ", -s * 0.6);\n" +
      "      ctx.lineTo(s * 0.6, s * " + r3 + ");\n" +
      "      ctx.stroke();\n" +
      "      ctx.beginPath();\n" +
      "      ctx.arc(s * " + r1 + ", s * " + r2 + ", s * 0.3, 0, Math.PI * 1.5);\n" +
      "      ctx.stroke();\n" +
      "      ctx.globalAlpha *= 0.6;\n" +
      "      ctx.beginPath();\n" +
      "      ctx.moveTo(-s * 0.2, -s * " + r3 + ");\n" +
      "      ctx.lineTo(0, 0);\n" +
      "      ctx.stroke();\n" +
      "      ctx.globalAlpha *= 0.6;\n" +
      "      ctx.beginPath();\n" +
      "      ctx.arc(s * " + r3 + ", -s * " + r1 + ", 2.5, 0, Math.PI * 2);\n" +
      "      ctx.fill();\n" +
      "      ctx.globalAlpha /= 0.36;\n";

  added += 
  "  {\n" +
  "    label:   '" + g.name + "',\n" +
  "    char:    '" + g.char + "',\n" +
  "    hue:     " + g.hue + ",\n" +
  "    baseX:   " + bx + ",\n" +
  "    baseY:   " + by + ",\n" +
  "    draw(ctx, R) {\n" + drawCode + "    },\n" +
  "  },\n";
});

content = content.replace(/(  \},)(\n\s*\];)/, "$1\n" + added + "$2");
fs.writeFileSync(enginePath, content, 'utf8');
console.log('Added 25 new glyphs');
