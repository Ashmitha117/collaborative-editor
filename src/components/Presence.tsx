import { useEffect, useState } from "react";

type PresenceProps = {
  awareness: any; // y-protocols Awareness
};

type UserInfo = {
  id?: string;
  name?: string;
  color?: string;
  colorLight?: string;
};

const Presence = ({ awareness }: PresenceProps) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [localUserId, setLocalUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!awareness) return;

    const handle = () => {
      const states = Array.from(awareness.getStates().values()) as any[];
      const list = states
        .map((state) => state.user)
        .filter(Boolean);
      setUsers(list);
      setLocalUserId(awareness.getLocalState()?.user?.id);
    };

    awareness.on("update", handle);
    handle();

    return () => {
      awareness.off("update", handle);
    };
  }, [awareness]);

  if (users.length === 0) {
    return <div className="text-sm text-slate-400">No collaborators yet</div>;
  }

  return (
    <div className="flex items-center gap-2 text-slate-100">
      <div className="text-sm font-medium">{users.length} collaborator{users.length === 1 ? "" : "s"}</div>
      {users.map((user, index) => {
        const initials = user.name
          ? user.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
          : "?";

        return (
          <div
            key={user.id || index}
            className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: user.colorLight || "rgba(148,163,184,0.16)" }}
            title={user.name}
          >
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
              style={{ background: user.color || "#64748b" }}
            >
              {initials}
            </span>
            <span className={user.id === localUserId ? "text-cyan-300" : "text-slate-100"}>
              {user.name}
              {user.id === localUserId ? " (You)" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Presence;
