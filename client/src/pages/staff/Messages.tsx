import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { formatTime } from "@/lib/utils";
import { Send } from "lucide-react";

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  participants: string[];
}

interface ChatMessage {
  id: number;
  roomId: string;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

export default function StaffMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["chat", "rooms"],
    queryFn: () => apiFetch("/api/chat/rooms"),
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["chat", "messages", activeRoom],
    queryFn: () => apiFetch(`/api/chat/rooms/${activeRoom}/messages`),
    enabled: !!activeRoom,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ roomId, content }: { roomId: string; content: string }) =>
      apiPost(`/api/chat/rooms/${roomId}/messages`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "messages", activeRoom] });
      setMessage("");
    },
  });

  useEffect(() => {
    if (rooms.length > 0 && !activeRoom) setActiveRoom(rooms[0].id);
  }, [rooms, activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activeRoom) return;
    sendMutation.mutate({ roomId: activeRoom, content: message.trim() });
  };

  const activeRoomData = rooms.find((r) => r.id === activeRoom);

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Messages</h1>
        <p className="text-sm text-gray-500">Chat with HR, Safety, and Security</p>
      </div>

      <div className="flex gap-4" style={{ height: 560 }}>
        {/* Room list */}
        <div className="w-48 shrink-0 space-y-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${activeRoom === room.id ? "bg-hensek-dark text-white" : "hover:bg-gray-100 text-gray-700"}`}
              onClick={() => setActiveRoom(room.id)}
            >
              <p className="font-medium truncate">{room.name}</p>
              <p className={`text-[10px] mt-0.5 capitalize ${activeRoom === room.id ? "text-white/60" : "text-gray-400"}`}>{room.type.replace(/_/g, " ")}</p>
            </button>
          ))}
        </div>

        {/* Chat pane */}
        <div className="flex-1 flex flex-col hensek-card overflow-hidden">
          {activeRoomData && (
            <div className="px-4 py-3 border-b border-border bg-gray-50">
              <p className="text-sm font-semibold text-hensek-dark">{activeRoomData.name}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">No messages yet. Say hello!</p>
            )}
            {messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{m.senderName}</p>}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-hensek-dark text-white rounded-br-sm" : "bg-gray-100 text-hensek-dark rounded-bl-sm"}`}>
                    {m.content}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 mx-1">{formatTime(m.createdAt)}</p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {activeRoom && (
            <div className="px-4 py-3 border-t border-border flex items-center gap-2">
              <input
                className="hensek-input text-sm flex-1"
                placeholder="Type a message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                className="w-9 h-9 bg-hensek-dark text-white rounded-xl flex items-center justify-center hover:bg-hensek-dark/80 transition-colors"
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
