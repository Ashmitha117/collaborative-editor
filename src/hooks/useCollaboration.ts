import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

type UseCollaborationOptions = {
  roomId: string;
  url?: string;
};

export type UserInfo = {
  id: string;
  name: string;
  color: string;
  colorLight: string;
};

type UseCollaborationResult = {
  doc: Y.Doc;
  text: Y.Text;
  provider: WebsocketProvider | null;
  connected: boolean;
  userInfo: UserInfo;
};

export function getDevBackendOrigin() {
  if (typeof window === "undefined") return "localhost:1234";
  return `${window.location.hostname}:1234`;
}

export const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL ||
  (typeof window !== "undefined"
    ? import.meta.env.DEV
      ? `ws://${getDevBackendOrigin()}`
      : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
    : "ws://localhost:1234");

export function randomColorPair() {
  const hue = Math.floor(Math.random() * 360);
  const color = `hsl(${hue}, 92%, 56%)`;
  const colorLight = `hsl(${hue}, 92%, 83%)`;
  return { color, colorLight };
}

export function createUserInfo(): UserInfo {
  const id = `user-${Math.floor(Math.random() * 1000000)}`;
  return {
    id,
    name: `User ${id.slice(id.length - 4)}`,
    ...randomColorPair(),
  };
}

export const useCollaboration = ({
  roomId,
  url = DEFAULT_WS_URL,
}: UseCollaborationOptions): UseCollaborationResult => {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const userInfo = useMemo(() => createUserInfo(), []);

  const text = useMemo(() => doc.getText("codemirror"), [doc]);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(url, roomId, doc);

    wsProvider.awareness.setLocalStateField("user", userInfo);

    const handleStatus = (event: any) => {
      setConnected(event.status === "connected");
    };

    wsProvider.on("status", handleStatus);
    setProvider(wsProvider);

    return () => {
      wsProvider.off("status", handleStatus);
      wsProvider.destroy();
      doc.destroy();
    };
  }, [doc, roomId, url, userInfo]);

  return {
    doc,
    text,
    provider,
    connected,
    userInfo,
  };
};
