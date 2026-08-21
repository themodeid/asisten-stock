"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api } from "@/services/api";
import { Send, Bot, User, Sparkles, Terminal, RefreshCw, Cpu } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls?: { toolName: string; args: any; result: any }[];
  timestamp: Date;
}

const SAMPLE_PROMPTS = [
  "Beli BBCA 10 lot di harga 9850",
  "Portofolio saya gimana?",
  "Analisa valuasi saham BBRI",
  "Cek harga TLKM hari ini",
  "Jual BBCA 5 lot di 10000",
];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: "Halo! Saya **Jarvis Stock AI**, asisten portofolio saham pribadi Anda.\n\nAnda dapat mengetik perintah secara natural seperti mencatat transaksi, menanyakan ringkasan keuntungan portofolio, atau meminta analisis fundamental emiten.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/gemini/chat", {
        user_id: 1,
        message: text.trim(),
      });

      const data = res.data?.data;
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data?.replyText || "Permintaan telah diproses.",
        toolCalls: data?.toolCallsExecuted || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `Maaf, terjadi kendala saat memproses pesan: ${
          err.response?.data?.message || err.message
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="AI Simulator (Telegram Bot Emulator)" />

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto flex flex-col min-h-0">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 shrink-0">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Contoh Prompt:
          </span>
          {SAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 whitespace-nowrap transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-6 shadow-inner">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4.5 space-y-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm"
                }`}
              >
                {/* Tool Calling Execution Logs if any */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 pb-2 mb-2 border-b border-slate-700">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
                      <Cpu className="w-3.5 h-3.5" />
                      Function Calling Executed:
                    </div>
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300"
                      >
                        <span className="text-emerald-400 font-bold">
                          {tc.toolName}
                        </span>
                        <span className="text-slate-400">
                          ({JSON.stringify(tc.args)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                <div
                  className={`text-[10px] ${
                    msg.role === "user" ? "text-blue-200" : "text-slate-500"
                  } text-right`}
                >
                  {msg.timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 justify-start items-center">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Jarvis AI sedang memproses dan mengeksekusi tools...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex gap-3 shrink-0"
        >
          <input
            type="text"
            placeholder="Ketik instruksi (mis: Beli BBCA 10 lot di 9850, Portofolio saya gimana?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Kirim
          </button>
        </form>
      </main>
    </div>
  );
}
