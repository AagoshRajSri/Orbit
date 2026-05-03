import { Sparkles } from "lucide-react";

// Local dataset array simulating stickers via Noto Emoji high-res SVGs
const STICKERS = [
  { id: "s1", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f60e.png", label: "cool" },
  { id: "s2", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f602.png", label: "joy" },
  { id: "s3", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f525.png", label: "fire" },
  { id: "s4", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f4af.png", label: "100" },
  { id: "s5", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f480.png", label: "skull" },
  { id: "s6", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f680.png", label: "rocket" },
  { id: "s7", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f92f.png", label: "mindblown" },
  { id: "s8", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f4fb.png", label: "radio" },
  { id: "s9", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f4ab.png", label: "stars" },
  { id: "s10", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u2728.png", label: "sparkles" },
  { id: "s11", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f311.png", label: "newmoon" },
  { id: "s12", url: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f607.png", label: "halo" },
];

export default function StickerPicker({ onSelectSticker }) {
  return (
    <div className="flex flex-col w-56 h-64 bg-base-100/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-base-300/60 overflow-hidden">
      <div className="p-3 border-b border-base-300/40 sticky top-0 bg-base-100/90 z-10 flex items-center justify-center gap-2">
        <Sparkles size={16} className="text-secondary" />
        <span className="text-sm font-bold tracking-widest uppercase font-bricolage pr-2 opacity-80">Stickers</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="grid grid-cols-3 gap-3">
          {STICKERS.map((sticker) => (
            <button 
              key={sticker.id}
              className="w-full aspect-square bg-base-200/40 rounded-xl hover:bg-base-200 hover:scale-110 transition-all duration-200 flex items-center justify-center p-2 group shadow-sm border border-transparent hover:border-primary/20"
              onClick={() => onSelectSticker(sticker.url)}
              title={sticker.label}
            >
              <img 
                src={sticker.url} 
                alt={sticker.label} 
                className="w-full h-full object-contain filter group-hover:brightness-110 transition-all z-10 drop-shadow-md" 
                loading="lazy" 
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
