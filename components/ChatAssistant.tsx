
import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ChatAssistant: React.FC<{ context?: string }> = ({ context = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hello! I am your Education Hills Assistant. Ask me about fee policies, draft reminders, or general inquiries.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      let apiKey = '';
      try {
        if (typeof process !== 'undefined' && process.env) {
          apiKey = process.env.API_KEY || '';
        }
      } catch (e) {
        // ignore
      }

      if (!apiKey) throw new Error("API Key missing");

      // Robust Client Init to prevent Illegal Constructor error
      let ai;
      try {
          if (typeof GoogleGenAI === 'function') {
             ai = new GoogleGenAI({ apiKey });
          } else {
             throw new Error("GoogleGenAI SDK not loaded correctly");
          }
      } catch (clientErr) {
          console.error("Failed to init AI client", clientErr);
          setMessages(prev => [...prev, { role: 'model', text: "Service temporarily unavailable (AI Client Init Failed)." }]);
          setLoading(false);
          return;
      }
      
      const prompt = `
        System: You are a helpful assistant for "The Education Hills" school fees management application.
        Context: ${context}
        User Query: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm not sure how to answer that." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Education Hills AI
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm max-w-[85%] ${m.role === 'user' ? 'bg-indigo-100 text-indigo-900 self-end' : 'bg-white border border-gray-200 text-gray-800 self-start'}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500 italic animate-pulse">Thinking...</div>}
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
