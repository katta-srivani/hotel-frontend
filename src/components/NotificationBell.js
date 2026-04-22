import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";

function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err.response?.data || err.message);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchNotifications();
    }
  }, [loading, isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, location.pathname, fetchNotifications]);

  useEffect(() => {
    if (open && isAuthenticated) {
      fetchNotifications();
    }
  }, [open, isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  useEffect(() => {
    const refresh = () => {
      if (isAuthenticated) {
        fetchNotifications();
      }
    };

    const pushNotification = (event) => {
      const incoming = event?.detail?.notification;
      if (!incoming || !isAuthenticated) {
        return;
      }

      setNotifications((current) => {
        const existing = current.some((item) => item._id === incoming._id);
        if (existing) {
          return current;
        }
        return [incoming, ...current];
      });

      fetchNotifications();
    };

    window.addEventListener("app:notifications-updated", refresh);
    window.addEventListener("app:notification-created", pushNotification);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("app:notifications-updated", refresh);
      window.removeEventListener("app:notification-created", pushNotification);
      window.removeEventListener("focus", refresh);
    };
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (notification) => {
    try {
      await api.put(`/notifications/${notification._id}`);
      await fetchNotifications();

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (err) {
      console.error("Failed to update notification:", err.response?.data || err.message);
      if (notification.link) {
        navigate(notification.link);
      }
    } finally {
      setOpen(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-gray-700 transition hover:bg-gray-100 hover:text-rose-600"
        type="button"
        aria-label="Open notifications"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl bg-white p-4 shadow-xl z-50">
          <h2 className="mb-3 font-semibold">Notifications</h2>

          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`mb-2 cursor-pointer rounded-lg p-3 text-sm ${
                  notification.isRead ? "bg-gray-100" : "bg-blue-100"
                }`}
                onClick={() => markAsRead(notification)}
              >
                {notification.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
