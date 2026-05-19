import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

const typeStyles = {
  approval: {
    icon: ClipboardCheck,
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  rejected: {
    icon: X,
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-700",
  },
  completed: {
    icon: CheckCheck,
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  warning: {
    icon: Bell,
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  info: {
    icon: Clock,
    bg: "bg-slate-50",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
  },
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const NotificationPanel = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications(40);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!socket) return;

    const addPanelNotification = (notification) => {
      setNotifications((current) => {
        const id = notification.id || notification._id;
        const eventKey = notification.eventKey;
        if (
          current.some(
            (item) =>
              (item.id || item._id) === id ||
              (eventKey && item.eventKey === eventKey),
          )
        ) {
          return current;
        }
        return [
          {
            ...notification,
            id,
            isRead: false,
          },
          ...current,
        ].slice(0, 40);
      });
    };

    const handleNotification = (notification) => {
      addPanelNotification(notification);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen((current) => !current);
    if (!isOpen) loadNotifications();
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    const id = notification.id || notification._id;
    try {
      if (!notification.isRead && notification._id) {
        await markNotificationAsRead(id);
      }
      setNotifications((current) =>
        current.map((item) =>
          (item.id || item._id) === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setIsOpen(false);
    navigate(notification.actionPath || "/myrequests");
  };

  const handleDelete = async (event, notification) => {
    event.stopPropagation();
    const id = notification.id || notification._id;
    try {
      if (notification._id) {
        await deleteNotification(id);
      }
      setNotifications((current) =>
        current.filter((item) => (item.id || item._id) !== id),
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#f8fafc",
        }}
        aria-label="Open notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Notifications
              </p>
              <p className="text-xs text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReadAll}
              disabled={!unreadCount}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <CheckCheck size={15} />
              Read all
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No notifications
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Workflow updates will appear here.
                </p>
              </div>
            )}

            {!isLoading &&
              notifications.map((notification) => {
                const style = typeStyles[notification.type] || typeStyles.info;
                const Icon = style.icon;
                const id = notification.id || notification._id;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      !notification.isRead ? style.bg : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.iconBg} ${style.iconColor}`}
                      >
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {notification.title}
                          </p>
                          <button
                            type="button"
                            onClick={(event) =>
                              handleDelete(event, notification)
                            }
                            className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            aria-label="Remove notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-5">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-medium text-slate-500">
                            {formatTime(
                              notification.createdAt ||
                                notification.timestamp,
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                            View <ExternalLink size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
