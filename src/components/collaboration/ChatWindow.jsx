import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";

export default function ChatWindow({ chat, currentUser }) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", chat],
    queryFn: async () => {
      if (chat.type === "direct") {
        const msgs = await base44.entities.Message.filter({
          message_type: "direct"
        });
        return msgs.filter(m => 
          (m.sender_email === currentUser?.email && m.recipient_email === chat.email) ||
          (m.sender_email === chat.email && m.recipient_email === currentUser?.email)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      } else {
        const msgs = await base44.entities.Message.filter({
          channel_id: chat.id
        });
        return msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    },
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chat] });
      setMessageInput("");
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const messageData = {
      sender_email: currentUser?.email,
      sender_name: currentUser?.full_name,
      content: messageInput,
      message_type: chat.type,
      timestamp: new Date().toISOString(),
    };

    if (chat.type === "direct") {
      messageData.recipient_email = chat.email;
    } else {
      messageData.channel_id = chat.id;
    }

    sendMutation.mutate(messageData);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-[#0a1628] to-[#0f2240] text-white">
        <h2 className="font-semibold">{chat.type === "direct" ? chat.name : `#${chat.name}`}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_email === currentUser?.email ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender_email === currentUser?.email
                    ? "bg-[#7ed957] text-black rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {chat.type === "channel" && msg.sender_email !== currentUser?.email && (
                  <p className="text-xs font-semibold opacity-75 mb-1">{msg.sender_name}</p>
                )}
                <p className="break-words">{msg.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {format(new Date(msg.timestamp), "HH:mm")}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button onClick={handleSendMessage} className="bg-[#7ed957] hover:bg-[#6cc844] text-black">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}