import { useEffect, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notification.service";
import type { AppNotification } from "../../types/notification";
import { formatDate } from "../../utils/formatDate";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    const updated = await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }

  async function markAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="empty">Loading…</p>}
      {!loading && notifications.length === 0 && <p className="empty">You have no notifications yet.</p>}

      {notifications.map((n) => (
        <div
          key={n.id}
          className="card"
          style={{
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            background: n.isRead ? "var(--card)" : "#eef6f1",
            borderColor: n.isRead ? "var(--border)" : "var(--accent)",
          }}
        >
          <div>
            <div>{n.message}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {formatDate(n.createdAt)}
            </div>
          </div>
          {!n.isRead && (
            <button className="btn" onClick={() => markRead(n.id)}>
              Mark read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
