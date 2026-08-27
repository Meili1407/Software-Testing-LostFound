import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface RequireRoleProps {
  roles: string[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { actor, loading } = useAuth();

  if (loading) return <div className="container">Loading…</div>;

  if (!actor || !roles.includes(actor.role)) {
    return (
      <div className="container">
        <h1>Restricted</h1>
        <p className="muted">
          {actor
            ? `You're signed in as ${actor.displayName} (${actor.role}). Switch to a ${roles
                .join(" or ")
                .toLowerCase()} account to view this page.`
            : "Sign in to view this page."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
