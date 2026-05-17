import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useSoundManager } from "../../hooks/useSoundManager";

const GIPHY_API_KEY = "zO14Dh7mYh9cbPGmEltqBVynZM99ZDuY";

export default function GifPicker({ t, onSelectGif }) {
  const { play } = useSoundManager();
  const [gifs, setGifs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const fetchGifs = async (searchTerm = "") => {
    setLoading(true);
    try {
      const endpoint = searchTerm.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Failed to fetch GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifs();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      fetchGifs(value);
    }, 500);
  };

  const isDark = t?.id !== "premium" && t?.id !== "pastel" && t?.id !== "light";
  const acc = t?.["--acc"] || "#7c3aed";
  const txt = t?.["--text"] || (isDark ? "#fff" : "#111");
  const txt2 = t?.["--text2"] || (isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)");
  const bdr = t?.["--border"] || (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");
  const bg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";

  return (
    <div className="flex flex-col w-full h-full bg-transparent overflow-hidden">
      <div 
        className="p-4 border-b sticky top-0 z-10"
        style={{ borderBottomColor: bdr, background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}
      >
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search
              style={{ color: txt2 }}
              className="transition-colors duration-300"
              size={18}
            />
          </div>
          <input
            type="text"
            placeholder="Explore the visual archive..."
            value={query}
            onChange={handleSearch}
            onFocus={e => {
              play?.('hover');
              e.currentTarget.style.borderColor = acc;
              e.currentTarget.style.boxShadow = `0 0 10px ${acc}22`;
            }}
            style={{
              background: bg,
              color: txt,
              borderColor: bdr,
              fontFamily: t?.["--font"] || t?.font || "inherit",
            }}
            className="w-full hover:bg-opacity-5 focus:bg-opacity-10 outline-none rounded-2xl py-3.5 pl-14 pr-10 text-sm font-medium tracking-tight transition-all duration-500 shadow-inner border"
            onMouseEnter={e => e.currentTarget.style.borderColor = acc + "66"}
            onMouseLeave={e => e.currentTarget.style.borderColor = bdr}
            onBlur={e => {
              e.currentTarget.style.borderColor = bdr;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              <Loader2 className="animate-spin" style={{ color: acc }} size={12} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 relative">
        {loading && gifs.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                className="w-full rounded-xl overflow-hidden shadow-sm hover:scale-[1.03] transition-transform bg-base-200/50 aspect-square group relative"
                onClick={() => onSelectGif(gif.images.fixed_height.mp4)}
              >
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none rounded-xl"></div>
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {gifs.length === 0 && !loading && (
              <div className="col-span-2 text-center py-10 text-sm text-base-content/50">
                No GIFs found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
