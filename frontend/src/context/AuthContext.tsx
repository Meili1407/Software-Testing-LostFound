import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listUsers } from "../services/user.service";
import { getActorId, setActorId as persistActorId } from "../services/api";
import type { User } from "../types/user";

interface AuthContextValue {
  users: User[];
  actor: User | null;
  loading: boolean;
  setActor: (userId: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [actorId, setActorIdState] = useState<string | null>(getActorId());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUsers()
      .then((list) => {
        setUsers(list);
        if (!actorId && list.length > 0) {
          setActorIdState(list[0].id);
          persistActorId(list[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function setActor(userId: string) {
    persistActorId(userId);
    setActorIdState(userId);
  }

  const actor = users.find((u) => u.id === actorId) ?? null;

  return (
    <AuthContext.Provider value={{ users, actor, loading, setActor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
