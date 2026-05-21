import { Check, X } from "lucide-react";
import { useContactStore } from "../../store/useContactStore";
import toast from "react-hot-toast";

export default function ContactRequestCard({ request }) {
  const { acceptRequest, declineRequest } = useContactStore();

  const handleAccept = async () => {
    try {
      await acceptRequest(request._id, request.sender._id);
      toast.success("Request accepted!");
    } catch (err) {
      toast.error("Failed to accept");
    }
  };

  const handleDecline = async () => {
    try {
      await declineRequest(request._id);
      toast.success("Request declined!");
    } catch (err) {
      toast.error("Failed to decline");
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-base-200 rounded-xl">
      <div className="flex items-center gap-3">
        <img src={request.sender.profilePic || "/avatar.png"} alt={request.sender.username} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <div className="font-bold">{request.sender.username}</div>
          <div className="text-xs opacity-70">Wants to connect</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleAccept} className="btn btn-circle btn-sm btn-success text-white">
          <Check size={16} />
        </button>
        <button onClick={handleDecline} className="btn btn-circle btn-sm btn-error text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
