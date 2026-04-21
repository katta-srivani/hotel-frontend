import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";


function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    }
  };

  const markAsRead = async (notification) => {
    try {
      await api.put(`/notifications/${notification._id}`);
      fetchNotifications();
      if (notification.link) {
        navigate(notification.link);
      }
    } catch {
      // Ignore notification update errors to keep bell usable.
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        <span style={{fontSize: '1.5em'}}>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl p-4 z-50">
          <h2 className="font-semibold mb-3">Notifications</h2>

          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                className={`p-2 rounded-lg mb-2 cursor-pointer ${
                  n.isRead ? "bg-gray-100" : "bg-blue-100"
                }`}
                onClick={() => markAsRead(n)}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
