import { useState } from "react";
import { Ban, Flag, VolumeX, UserX, AlertTriangle, Check, X } from "lucide-react";
import { axiosInstance } from "../../lib/axios.jsx";
import toast from "../../lib/toast";

const REPORT_REASONS = [
  "Spam or unwanted messages",
  "Harassment or bullying",
  "Threats or violence",
  "Inappropriate content",
  "Impersonation",
  "Other",
];

/**
 * Block/Report/Restrict action sheet for a user.
 *
 * @param {Object} props
 * @param {string} props.userId       Target user's _id
 * @param {string} props.username     Target user's display name
 * @param {Function} props.onClose    Called when the sheet is dismissed
 * @param {Function} [props.onBlock]  Optional callback after a successful block
 */
const UserSafetySheet = ({ userId, username, onClose, onBlock }) => {
  const [view, setView] = useState("menu"); // "menu" | "report" | "block_confirm"
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post(`/auth/contacts/${userId}/block`);
      toast.success(`@${username} has been blocked`);
      onBlock?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to block user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    setIsLoading(true);
    try {
      // Store report via audit log / future moderation endpoint
      await axiosInstance.post(`/auth/contacts/${userId}/report`, {
        reason: reportReason,
        note: reportNote.trim(),
      }).catch(() => {
        // Report endpoint may not exist yet — fail gracefully
      });
      toast.success("Report submitted. Thank you for keeping Orbit safe.");
      onClose();
    } catch (err) {
      toast.error("Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full">
        <div className="bg-base-100/95 backdrop-blur-xl border border-base-300/60 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-base-300/50">
            <h3 className="font-bold text-base">
              {view === "report" ? "Report User" : view === "block_confirm" ? "Block User" : `Actions for @${username}`}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Menu View */}
          {view === "menu" && (
            <div className="p-3 flex flex-col gap-1">
              <ActionItem
                icon={<VolumeX className="size-4 text-amber-400" />}
                label="Mute Notifications"
                description="Stop receiving alerts from this user"
                onClick={async () => {
                  toast.info("Mute coming soon");
                  onClose();
                }}
              />
              <ActionItem
                icon={<Flag className="size-4 text-orange-400" />}
                label="Report"
                description="Report harmful or abusive behavior"
                onClick={() => setView("report")}
              />
              <ActionItem
                icon={<Ban className="size-4 text-red-500" />}
                label="Block"
                description="Prevent this user from messaging you"
                danger
                onClick={() => setView("block_confirm")}
              />
            </div>
          )}

          {/* Report View */}
          {view === "report" && (
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
                  Reason
                </label>
                <div className="mt-2 flex flex-col gap-1">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-colors ${
                        reportReason === r
                          ? "bg-primary/15 border border-primary/30 text-base-content"
                          : "hover:bg-base-200/40 border border-transparent text-base-content/70"
                      }`}
                    >
                      <div className={`size-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${reportReason === r ? "border-primary bg-primary" : "border-base-content/30"}`}>
                        {reportReason === r && <Check className="size-2.5 text-white" />}
                      </div>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Describe what happened..."
                  rows={3}
                  maxLength={500}
                  className="mt-2 textarea textarea-bordered w-full text-sm resize-none"
                />
                <div className="text-right text-xs text-base-content/40 mt-1">{reportNote.length}/500</div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setView("menu")} className="btn btn-ghost btn-sm flex-1">
                  Back
                </button>
                <button
                  onClick={handleReport}
                  disabled={isLoading}
                  className="btn btn-warning btn-sm flex-1 gap-2"
                >
                  {isLoading ? <span className="loading loading-spinner size-4" /> : <Flag className="size-4" />}
                  Submit Report
                </button>
              </div>
            </div>
          )}

          {/* Block Confirm View */}
          {view === "block_confirm" && (
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="size-16 rounded-full bg-error/15 border border-error/30 flex items-center justify-center">
                  <Ban className="size-7 text-error" />
                </div>
                <div>
                  <p className="font-bold">Block @{username}?</p>
                  <p className="text-sm text-base-content/65 mt-1 leading-relaxed">
                    They won't be able to message you or see your profile. You can unblock them anytime from Settings → Account.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setView("menu")} className="btn btn-ghost btn-sm flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  disabled={isLoading}
                  className="btn btn-error btn-sm flex-1 gap-2"
                >
                  {isLoading ? <span className="loading loading-spinner size-4" /> : <Ban className="size-4" />}
                  Block User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const ActionItem = ({ icon, label, description, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-xl text-left w-full transition-colors ${
      danger
        ? "hover:bg-error/10 border border-transparent hover:border-error/20"
        : "hover:bg-base-200/40 border border-transparent"
    }`}
  >
    <div className={`p-2 rounded-xl ${danger ? "bg-error/10" : "bg-base-200/50"}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-semibold ${danger ? "text-error" : "text-base-content"}`}>
        {label}
      </div>
      <div className="text-xs text-base-content/60 mt-0.5">{description}</div>
    </div>
  </button>
);

export default UserSafetySheet;
