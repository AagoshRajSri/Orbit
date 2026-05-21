import { useEffect } from "react";
import { Bell, Check, Trash2, ShieldAlert, MessageCircle, UserPlus, Info } from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useAuthStore } from "../../store/useAuthStore";

const NotificationTray = ({ isOpen, onClose }) => {
  const { 
    inbox, 
    unreadCount, 
    fetchInbox, 
    markAsRead, 
    markAllAsRead,
    isInboxLoading 
  } = useNotificationStore();
  
  const authUser = useAuthStore(s => s.authUser);

  useEffect(() => {
    if (isOpen && authUser) {
      fetchInbox();
    }
  }, [isOpen, authUser, fetchInbox]);

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case "contact_request": return <UserPlus className="size-4 text-primary" />;
      case "message": return <MessageCircle className="size-4 text-info" />;
      case "warning": return <ShieldAlert className="size-4 text-warning" />;
      case "admin_message": return <Info className="size-4 text-error" />;
      default: return <Bell className="size-4 text-base-content/70" />;
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-base-100/90 backdrop-blur-xl border-l border-base-300/50 z-50 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 border-b border-base-300/50 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Bell className="size-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="badge badge-primary badge-sm">{unreadCount}</span>
            )}
          </h2>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="btn btn-ghost btn-xs text-xs"
                title="Mark all as read"
              >
                <Check className="size-3 mr-1" /> All Read
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isInboxLoading ? (
            <div className="p-8 flex justify-center">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          ) : inbox.length === 0 ? (
            <div className="p-8 text-center text-sm text-base-content/50 flex flex-col items-center gap-2">
              <Bell className="size-8 opacity-20" />
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-base-300/30">
              {inbox.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`p-4 transition-colors hover:bg-base-200/30 cursor-pointer ${notif.read ? 'opacity-70' : 'bg-primary/5'}`}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif._id);
                    // Navigation logic could go here based on notif.type
                  }}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm truncate ${notif.read ? 'font-medium' : 'font-bold'}`}>
                          {notif.title || "Notification"}
                        </h4>
                        {!notif.read && (
                          <span className="size-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-base-content/80 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-base-content/40 mt-2 block">
                        {new Date(notif.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationTray;
