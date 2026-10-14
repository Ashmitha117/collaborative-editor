import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useMemo, useState } from "react";

const MAX_RECENT_ROOMS = 5;

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useLocalStorage<string>("collab:lastRoomId", "");
  const [recentRooms, setRecentRooms] = useLocalStorage<string[]>("collab:recentRooms", []);
  const [inputValue, setInputValue] = useState(roomId || "");

  const recentList = useMemo(() => recentRooms.filter(Boolean).slice(0, MAX_RECENT_ROOMS), [recentRooms]);

  const recordRoom = (id: string) => {
    setRoomId(id);
    setRecentRooms((prev) => {
      const next = [id, ...prev.filter((room) => room !== id)];
      return next.slice(0, MAX_RECENT_ROOMS);
    });
  };

  const createRoom = () => {
    const id = uuidv4();
    recordRoom(id);
    navigate(`/room/${id}`);
  };

  const joinRoom = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    recordRoom(trimmed);
    navigate(`/room/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Collaborative Code Editor</h1>
            <p className="mt-2 text-slate-400 max-w-xl">
              Create a room, share the link, and collaborate in real time with syntax-aware autocomplete and presence.
            </p>
          </div>

          <button
            onClick={createRoom}
            className="rounded-3xl bg-cyan-500 px-8 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            Create Room
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-5 py-4 text-white outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-400/30"
            />
          </div>
          <button
            onClick={joinRoom}
            className="rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            Join Room
          </button>
        </div>

        {recentList.length > 0 && (
          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Recent rooms</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recentList.map((room) => (
                <button
                  key={room}
                  onClick={() => {
                    setInputValue(room);
                    recordRoom(room);
                    navigate(`/room/${room}`);
                  }}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-left text-white transition hover:border-cyan-400 hover:bg-slate-800"
                >
                  <div className="text-sm text-slate-400">Room ID</div>
                  <div className="mt-2 truncate font-medium">{room}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

