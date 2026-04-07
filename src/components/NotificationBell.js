import React, { useEffect, useState } from "react";
import api from "../utils/api";


function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const res = await api.get("/notifications");
    setNotifications(res.data.notifications);
  };

  const markAsRead = async (id) => {
    await api.put(`/notifications/${id}`);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
                  n.read ? "bg-gray-100" : "bg-blue-100"
                }`}
                onClick={() => markAsRead(n._id)}
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