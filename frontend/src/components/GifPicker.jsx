import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useSoundManager } from "../hooks/useSoundManager";

const GIPHY_API_KEY = "zO14Dh7mYh9cbPGmEltqBVynZM99ZDuY";

export default function GifPicker({ onSelectGif }) {
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

  return (
    <div className="flex flex-col w-64 h-80 bg-base-100/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-base-300/60 overflow-hidden">
      <div className="p-5 border-b border-white/[0.03] bg-black/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search
              className="text-white/20 group-focus-within:text-[#5dcaa5] transition-colors duration-300"
              size={18}
            />
          </div>
          <input
            type="text"
            placeholder="Explore the visual archive..."
            value={query}
            onChange={handleSearch}
            onFocus={() => play?.('hover')}
            className="w-full bg-white/[0.02] hover:bg-white/[0.05] focus:bg-white/[0.07] outline-none rounded-2xl py-3.5 pl-14 pr-10 text-sm font-medium tracking-tight text-white/90 placeholder:text-white/10 border border-white/5 focus:border-[#5dcaa5]/40 focus:ring-4 focus:ring-[#5dcaa5]/5 transition-all duration-500 shadow-inner"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              <Loader2 className="animate-spin text-[#5dcaa5]/30" size={12} />
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
