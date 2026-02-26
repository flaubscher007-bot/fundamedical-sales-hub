import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, X } from "lucide-react";

export default function ChatList({ onSelectChat, currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("direct");
  const [users, setUsers] = useState([]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", currentUser?.email],
    queryFn: () => base44.entities.Message.filter({ sender_email: currentUser?.email }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const u = await base44.entities.User.list();
      setUsers(u.filter(user => user.email !== currentUser?.email));
      return u;
    },
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => base44.entities.Channel.list(),
  });

  // Get unique direct message conversations
  const getDirectConversations = () => {
    const conversations = new Map();
    messages.forEach(msg => {
      const otherEmail = msg.sender_email === currentUser?.email ? msg.recipient_email : msg.sender_email;
      const otherUser = allUsers.find(u => u.email === otherEmail);
      if (otherUser && !conversations.has(otherEmail)) {
        conversations.set(otherEmail, {
          email: otherEmail,
          name: otherUser.full_name,
          type: "direct"
        });
      }
    });
    return Array.from(conversations.values());
  };

  const directConversations = getDirectConversations();
  const filteredConversations = directConversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredChannels = channels.filter(c =>
    c.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.is_archived
  );

  return (
    <div className="w-full h-full flex flex-col bg-white border-r">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Conversations</h3>
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setActiveTab("direct")}
            className={`px-3 py-1 rounded ${activeTab === "direct" ? "bg-[#7ed957] text-black" : "bg-gray-200"}`}
          >
            Direct
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-3 py-1 rounded ${activeTab === "channels" ? "bg-[#7ed957] text-black" : "bg-gray-200"}`}
          >
            Channels
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "direct" ? (
          <div>
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No conversations yet</div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.email}
                  onClick={() => onSelectChat({type: "direct", email: conv.email, name: conv.name})}
                  className="w-full p-3 text-left hover:bg-gray-100 border-b transition-colors"
                >
                  <p className="font-medium text-sm">{conv.name}</p>
                  <p className="text-xs text-gray-500">{conv.email}</p>
                </button>
              ))
            )}
          </div>
        ) : (
          <div>
            {filteredChannels.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No channels yet</div>
            ) : (
              filteredChannels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChat({type: "channel", id: channel.id, name: channel.channel_name})}
                  className="w-full p-3 text-left hover:bg-gray-100 border-b transition-colors"
                >
                  <p className="font-medium text-sm">#{channel.channel_name}</p>
                  <p className="text-xs text-gray-500">{channel.description}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}