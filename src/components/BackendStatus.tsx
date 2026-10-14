import { useEffect, useState } from "react";

type BackendStatusData = {
  message?: string;
  persistenceActive?: boolean;
  persistenceDir?: string;
  serveFrontend?: boolean;
};

function getDevStatusUrl() {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${host}:1234/status`;
}

const statusUrl = import.meta.env.VITE_BACKEND_STATUS_URL ||
  (import.meta.env.DEV ? getDevStatusUrl() : "/status");

const BackendStatus = () => {
  const [status, setStatus] = useState<BackendStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const response = await fetch(statusUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!mounted) return;
        setStatus(data);
        setError(null);
      } catch {
        if (!mounted) return;
        setStatus(null);
        setError("Backend unreachable");
      }
    };

    fetchStatus();
    const interval = window.setInterval(fetchStatus, 10000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const label = error
    ? "Backend offline"
    : status
    ? "Backend online"
    : "Checking backend...";

  const badgeClasses = error
    ? "bg-red-600 text-white"
    : "bg-slate-800 text-slate-100";

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
        {label}
      </div>
      {status && !error && (
        <div className="text-xs text-slate-400">
          {status.persistenceActive
            ? "Persistence enabled"
            : "Persistence disabled"}
        </div>
      )}
    </div>
  );
};

export default BackendStatus;
