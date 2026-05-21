import { useState, useEffect } from "react";
import { Search, UserPlus } from "lucide-react";
import { useContactStore } from "../../store/useContactStore";
import toast from "react-hot-toast";

export default function ContactSearch() {
  const [query, setQuery] = useState("");
  const { searchContacts, searchResults, isLoading, sendRequest } = useContactStore();
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, searchContacts]);

  const handleSendRequest = async (userId) => {
    try {
      await sendRequest(userId);
      setSentRequests(prev => new Set(prev).add(userId));
      toast.success("Request sent!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to send request");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
        <input 
          type="text" 
          className="input input-bordered w-full pl-10" 
          placeholder="Search by username or orbitId..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      {isLoading && <div className="loading loading-spinner mx-auto" />}
      
      {!isLoading && searchResults.length > 0 && (
        <div className="flex flex-col gap-2">
          {searchResults.map(user => (
            <div key={user._id} className="flex items-center justify-between p-3 bg-base-200 rounded-xl">
              <div className="flex items-center gap-3">
                <img src={user.profilePic || "/avatar.png"} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-bold">{user.username}</div>
                  <div className="text-xs opacity-70">#{user.orbitTag} • {user.orbitId}</div>
                </div>
              </div>
              <button 
                onClick={() => handleSendRequest(user._id)}
                className="btn btn-sm btn-primary"
                disabled={sentRequests.has(user._id)}
              >
                {sentRequests.has(user._id) ? "Sent" : <><UserPlus size={16} /> Add</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
