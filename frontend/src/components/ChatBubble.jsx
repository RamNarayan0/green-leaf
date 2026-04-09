import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User } from 'lucide-react';
import { api } from '../services/api';
import useAppStore from '../store/useAppStore';

export default function ChatBubble({ orderId, recipientId, recipientName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAppStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      markAsRead();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/chat/${orderId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put(`/chat/${orderId}/read`);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.post(`/chat/${orderId}/messages`, {
        content: newMessage,
        recipientId
      });
      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-eco flex items-center justify-center hover:scale-110 transition-transform animate-in zoom-in"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">{recipientName || 'Delivery Partner'}</p>
                <p className="text-[10px] opacity-70 mt-1">Order #{orderId.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale opacity-50">
                 <MessageSquare className="w-10 h-10 mb-2" />
                 <p className="text-xs font-bold">Start a conversation for any delivery instructions</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                      msg.sender._id === user?._id
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted text-foreground rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-muted/50 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
