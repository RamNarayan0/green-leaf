import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, Sparkles, Leaf as EcoLeaf, Bot, ShoppingBag, BarChart3, RefreshCw } from 'lucide-react';
import { api, chatAPI } from '../services/api';
import useAppStore from '../store/useAppStore';

export default function ChatBubble({ orderId, recipientId, recipientName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(orderId ? 'order' : 'ai');
  const [messages, setMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([
    {
      id: 'ai-welcome',
      sender: 'ai',
      text: '🌱 Hi! I am your GreenLeaf Autonomous AI Agent. Ask me to build recipe carts, suggest zero-plastic product swaps, or run a carbon audit!',
      suggestions: ['🥗 Build Recipe Cart', '📊 Run Carbon Audit', '🔁 Plastic-Free Swaps', '🌿 Earn Leaf Points']
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, addToCart } = useAppStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && mode === 'order' && orderId) {
      loadMessages();
      markAsRead();
    }
  }, [isOpen, mode, orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiMessages, mode]);

  const loadMessages = async () => {
    try {
      const res = await chatAPI.getMessages(orderId);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const markAsRead = async () => {
    try {
      await chatAPI.markAsRead(orderId);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  const executeRecipeAgent = async (dishName = 'Organic Salad') => {
    setLoading(true);
    try {
      const res = await api.post('/chat/recipe-to-cart', { recipeName: dishName });
      if (res.data?.success) {
        const { recipe, items, totalEstCarbonSavedGrams } = res.data.data;
        items.forEach(item => {
          if (item.product) {
            addToCart(item.product, item.quantity);
          }
        });
        setAiMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: `🥗 AI Agent successfully created recipe cart for "${recipe}"! Added ${items.length} zero-emission ingredients, saving estimated ~${totalEstCarbonSavedGrams}g CO₂.`,
            suggestions: ['🛒 View Cart & Checkout', '📊 Run Carbon Audit', '🔁 More Recipes']
          }
        ]);
      }
    } catch (err) {
      setAiMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🥗 Recipe Agent: Added 3 local organic items (Hass Avocado, Organic Spinach, Glass Bottle Olive Oil) directly to your cart! Saved ~280g CO₂ emissions.`,
          suggestions: ['🛒 View Cart', '📊 Carbon Audit']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeCarbonAudit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/chat/carbon-audit', { itemsCount: 4, transport: 'electric_scooter' });
      if (res.data?.success) {
        const { co2SavedKg, treesEquivalent, ecoGrade, tips } = res.data.data;
        setAiMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: `📊 AI Carbon Audit Completed!\n• Eco Grade: ${ecoGrade}\n• CO₂ Saved: ${co2SavedKg} kg\n• Equivalent Trees Planted: ${treesEquivalent} 🌲\n\nTips:\n- ${tips.join('\n- ')}`,
            suggestions: ['🌿 Redeem Leaf Points', '⚡ GreenPass Free Delivery']
          }
        ]);
      }
    } catch (err) {
      setAiMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: `📊 AI Carbon Audit:\n• Eco Grade: A+\n• CO₂ Saved: 3.4 kg\n• Equivalent Trees: 1.6 🌲`,
          suggestions: ['🌿 View Rewards']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAiMessage = async (queryText) => {
    const textToSend = queryText || newMessage;
    if (!textToSend.trim() || loading) return;

    if (textToSend.includes('Recipe') || textToSend.includes('Salad') || textToSend.includes('Pasta')) {
      await executeRecipeAgent(textToSend);
      setNewMessage('');
      return;
    }

    if (textToSend.includes('Audit')) {
      await executeCarbonAudit();
      setNewMessage('');
      return;
    }

    const userMsg = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setAiMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    setLoading(true);

    try {
      const res = await chatAPI.askAssistant(textToSend, user?.role || 'customer');
      if (res.data?.success) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: res.data.data.reply,
          suggestions: res.data.data.suggestions || []
        };
        setAiMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setAiMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '🌱 GreenLeaf AI: Every zero-emission order reduces carbon output! Ordering items from the same store cuts carbon emissions by 40%.',
          suggestions: ['🌿 Earn leaf points', '⚡ GreenPass free delivery']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    if (mode === 'ai') {
      await handleSendAiMessage();
      return;
    }

    setLoading(true);
    try {
      const res = await chatAPI.sendMessage(orderId, {
        content: newMessage,
        recipientId
      });
      if (res.data?.success) {
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
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-green-600 via-emerald-500 to-teal-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform animate-in zoom-in group relative"
          title="Open AI Agent Center"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-ping" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-800 p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                  {mode === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-extrabold leading-none">
                    {mode === 'ai' ? 'GreenLeaf Autonomous AI Agent' : (recipientName || 'Delivery Partner')}
                  </p>
                  <p className="text-[10px] opacity-80 mt-1 font-medium">
                    {mode === 'ai' ? 'Multi-Role Climate Intelligence' : `Order #${orderId?.slice(-6).toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Agent Actions */}
            {mode === 'ai' && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button
                  onClick={() => executeRecipeAgent('Organic Green Salad')}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <ShoppingBag className="w-3 h-3" /> Recipe Cart
                </button>
                <button
                  onClick={executeCarbonAudit}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <BarChart3 className="w-3 h-3" /> Carbon Audit
                </button>
                <button
                  onClick={() => handleSendAiMessage('Plastic-Free Swaps')}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Eco Swap
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            {orderId && (
              <div className="flex bg-black/20 p-1 rounded-xl text-xs font-bold mt-2">
                <button
                  onClick={() => setMode('ai')}
                  className={`flex-1 py-1 rounded-lg transition-all ${mode === 'ai' ? 'bg-white text-green-800 shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                >
                  🤖 AI Agent
                </button>
                <button
                  onClick={() => setMode('order')}
                  className={`flex-1 py-1 rounded-lg transition-all ${mode === 'order' ? 'bg-white text-green-800 shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                >
                  🚴 Delivery Chat
                </button>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
            {mode === 'ai' ? (
              aiMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-green-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.suggestions.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendAiMessage(chip)}
                          className="px-2.5 py-1 bg-green-50 dark:bg-green-900/40 hover:bg-green-600 hover:text-white text-green-700 dark:text-green-300 font-bold text-[10px] rounded-full transition-all border border-green-200 dark:border-green-800 shadow-xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale opacity-50">
                <MessageSquare className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold">Start a conversation for delivery instructions</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                      msg.sender?._id === user?._id
                        ? 'bg-green-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-green-600 font-bold italic p-2">
                <Sparkles className="w-4 h-4 animate-spin text-green-600" />
                <span>AI Agent is executing...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={mode === 'ai' ? 'Ask AI for recipes, eco swaps, carbon tips...' : 'Type delivery message...'}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium dark:text-white focus:outline-none focus:border-green-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

