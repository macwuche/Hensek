import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { formatTime, cn } from "@/lib/utils";
import { Send, MessageSquare } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

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
    <div className="hensek-page-shell">
      <PageHeader title="Messages" subtitle="Chat with HR, Safety, and Security" />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4" style={{ minHeight: 560 }}>
        <div className="hensek-card p-3 overflow-y-auto" style={{ maxHeight: 620 }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">Rooms</p>
          {rooms.length === 0 ? (
            <EmptyState icon={<MessageSquare size={18} />} title="No rooms" description="You don't have any chat rooms yet." />
          ) : (
            <ul className="space-y-1">
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    onClick={() => setActiveRoom(room.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors",
                      activeRoom === room.id
                        ? "bg-hensek-dark text-white"
                        : "hover:bg-hensek-cream/60 text-gray-700",
                    )}
                  >
                    <p className="font-medium truncate">{room.name}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-0.5 capitalize",
                        activeRoom === room.id ? "text-white/60" : "text-gray-400",
                      )}
                    >
                      {room.type.replace(/_/g, " ")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hensek-card p-0 flex flex-col overflow-hidden" style={{ height: 620 }}>
          {activeRoomData ? (
            <>
              <div className="px-5 py-3 border-b border-border bg-hensek-cream/40">
                <p className="text-sm font-semibold text-hensek-dark">{activeRoomData.name}</p>
                <p className="text-[10px] text-gray-500 capitalize">{activeRoomData.type.replace(/_/g, " ")}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center mt-8">No messages yet. Say hello!</p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        {!isMe && <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{m.senderName}</p>}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                            isMe
                              ? "bg-hensek-dark text-white rounded-br-sm"
                              : "bg-hensek-cream text-hensek-dark rounded-bl-sm",
                          )}
                        >
                          {m.content}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 mx-1">{formatTime(m.createdAt)}</p>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                <input
                  className="hensek-input flex-1"
                  placeholder="Type a message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMutation.isPending}
                  className="w-9 h-9 bg-hensek-dark text-white rounded-xl flex items-center justify-center hover:bg-hensek-dark/85 transition-colors disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<MessageSquare size={18} />}
              title="Select a room"
              description="Choose a chat room from the left to start messaging."
            />
          )}
        </div>
      </div>
    </div>
  );
}
