import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import type { UserInfo } from "../hooks/useCollaboration";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  color: string;
  text: string;
  timestamp: number;
};

type ChatProps = {
  doc: Y.Doc;
  userInfo: UserInfo;
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light" | "one-dark";
};

export const Chat = ({
  doc,
  userInfo,
  isOpen,
  onClose,
  theme,
}: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isLight = theme === "light";
  const chatArray = useMemo(() => doc.getArray<ChatMessage>("chat-messages"), [doc]);

  useEffect(() => {
    // Populate initial messages
    setMessages(chatArray.toArray());

    const observer = () => {
      setMessages(chatArray.toArray());
    };

    chatArray.observe(observer);
    return () => {
      chatArray.unobserve(observer);
    };
  }, [chatArray]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: userInfo.id,
      senderName: userInfo.name,
      color: userInfo.color,
      text: trimmed,
      timestamp: Date.now(),
    };

    chatArray.push([newMessage]);
    setText("");
  };

  const handleClear = () => {
    chatArray.delete(0, chatArray.length);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 right-0 z-50 flex h-full w-80 md:w-96 flex-col border-l shadow-2xl transition-all duration-300 ${
        isLight
          ? "border-slate-200 bg-white text-slate-800"
          : "border-slate-800 bg-slate-950 text-slate-100"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${
          isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-semibold text-sm">Room Chat</h3>
          <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400 font-medium">
            {messages.length} msgs
          </span>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-red-400 transition cursor-pointer"
              title="Clear all messages for this room"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-400">
            <span className="text-2xl mb-2">👋</span>
            <p className="font-medium">No messages yet</p>
            <p className="text-slate-500 mt-1">Start chatting with your collaborators in this room!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userInfo.id;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: msg.color }}
                  />
                  <span className="font-semibold" style={{ color: msg.color }}>
                    {msg.senderName} {isMe ? "(You)" : ""}
                  </span>
                  <span className="text-[10px] text-slate-500">{timeStr}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words shadow-sm ${
                    isMe
                      ? "bg-sky-600 text-white rounded-tr-none"
                      : isLight
                      ? "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                      : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className={`border-t p-3 ${
          isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900"
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 rounded-xl px-3 py-2 text-sm outline-none transition border ${
              isLight
                ? "bg-white border-slate-300 text-slate-800 focus:border-sky-500"
                : "bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500"
            }`}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white transition hover:bg-sky-400 disabled:opacity-40 cursor-pointer"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};
