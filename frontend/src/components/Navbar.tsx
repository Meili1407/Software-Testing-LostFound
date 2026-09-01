import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listNotifications } from "../services/notification.service";

export function Navbar() {
  const { users, actor, setActor } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!actor) return;
    listNotifications()
      .then((list) => setUnreadCount(list.filter((n) => !n.isRead).length))
      .catch(() => setUnreadCount(0));
  }, [actor]);

  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-brand">
        Campus Lost &amp; Found
      </NavLink>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        {actor?.role === "STUDENT" && <NavLink to="/student">Student</NavLink>}
        {(actor?.role === "STAFF" || actor?.role === "ADMIN") && <NavLink to="/staff">Staff</NavLink>}
        {actor?.role === "ADMIN" && <NavLink to="/admin/audit-log">Audit Log</NavLink>}
        <NavLink to="/found-items">Found Items</NavLink>
        <NavLink to="/claims/track">Track Claim</NavLink>
        {actor && (
          <NavLink to="/notifications">
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </NavLink>
        )}
      </nav>

      <div className="navbar-actor" title="This stands in for signing in — pick who you are to try the app as a student or as staff.">
        <label htmlFor="actor-select">
          Acting as
          <span className="navbar-actor-hint">(simulates sign-in)</span>
        </label>
        <select
          id="actor-select"
          value={actor?.id ?? ""}
          onChange={(e) => setActor(e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
