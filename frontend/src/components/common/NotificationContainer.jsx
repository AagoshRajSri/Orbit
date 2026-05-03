/**
 * Notification Container Component
 * Displays all active notifications in a stacked layout
 */

import React from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import { NotificationItem } from "./NotificationItem";

export const NotificationContainer = () => {
  const notifications = useNotificationStore((state) => state.notifications);

  // Group notifications by position
  const notificationsByPosition = notifications.reduce((acc, notif) => {
    const position = notif.position || "top-right";
    if (!acc[position]) acc[position] = [];
    acc[position].push(notif);
    return acc;
  }, {});

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <>
      {Object.entries(notificationsByPosition).map(([position, notifs]) => (
        <div
          key={position}
          className={`fixed ${positionClasses[position]} flex flex-col gap-3 pointer-events-none z-[999] max-w-sm`}
          style={{ pointerEvents: "auto" }}
        >
          {notifs.map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <NotificationItem notification={notification} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
