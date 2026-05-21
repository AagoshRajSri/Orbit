import { useState } from "react";
// Removed lucide-react import to avoid minification collisions
import { useNexusStore } from "../../store/useNexusStore";
import toast from "react-hot-toast";
import { useSoundManager } from "../../hooks/useSoundManager";

// Inline SVG icons (no external dependency)
const IconPlus = ({ size = 24, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconHash = ({ size = 24, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);
const IconWand2 = ({ size = 24, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
    <path d="m14 7 3 3" />
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </svg>
);

const NexusActions = () => {
  const { play } = useSoundManager();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [nexusName, setNexusName] = useState("");
  const [nexusDescription, setNexusDescription] = useState("");

  const { joinNexus, createNexus } = useNexusStore();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error("Please enter a join code");
    try {
      await joinNexus(joinCode.trim());
      setIsJoinModalOpen(false);
      setJoinCode("");
    } catch (error) {
      // Error handled in store
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nexusName.trim()) return toast.error("Nexus name is required");
    try {
      await createNexus({
        name: nexusName.trim(),
        description: nexusDescription.trim(),
      });
      setIsCreateModalOpen(false);
      setNexusName("");
      setNexusDescription("");
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="p-3 border-b border-base-300 flex gap-2">
      <button
        onClick={() => {
          play("click");
          setIsJoinModalOpen(true);
        }}
        className="btn btn-sm btn-ghost gap-2 flex-1 glass hover:bg-primary/20 font-outfit"
      >
        <IconHash className="size-4" />
        <span className="hidden lg:inline text-[11px] font-black uppercase tracking-wider">
          Join
        </span>
      </button>
      <button
        onClick={() => {
          play("click");
          setIsCreateModalOpen(true);
        }}
        className="btn btn-sm btn-primary gap-2 flex-1 shadow-md hover:scale-105 transition-transform font-outfit"
      >
        <IconPlus className="size-4" />
        <span className="hidden lg:inline text-[11px] font-black uppercase tracking-wider">
          Nexus
        </span>
      </button>

      {/* Join Modal */}
      {isJoinModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box glass bg-base-100/90 border border-primary/20">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <IconHash className="text-primary" /> Join a Nexus
            </h3>
            <form onSubmit={handleJoin}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nexus Join Code</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. X82K9L"
                  className="input input-bordered w-full"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    play("click");
                    setIsJoinModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={() => play("click")}
                >
                  Join Nexus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box glass bg-base-100/90 border border-primary/20">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <IconWand2 className="text-primary" /> Create New Nexus
            </h3>
            <form onSubmit={handleCreate}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-sm">Nexus Name</span>
                </label>
                <input
                  type="text"
                  placeholder="The Cool Squad"
                  className="input input-bordered w-full"
                  value={nexusName}
                  onChange={(e) => setNexusName(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">
                    Description (Optional)
                  </span>
                </label>
                <textarea
                  placeholder="A placeholder for all our memes..."
                  className="textarea textarea-bordered h-24"
                  value={nexusDescription}
                  onChange={(e) => setNexusDescription(e.target.value)}
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    play("click");
                    setIsCreateModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={() => play("click")}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NexusActions;
