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

      <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto flex flex-col min-h-0">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" /> Contoh Prompt:
          </span>
          {SAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 overflow-y-auto space-y-4 shadow-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl p-3.5 space-y-2.5 ${
                  msg.role === "user"
                    ? "bg-zinc-100 text-zinc-900 rounded-br-none font-medium shadow-sm"
                    : "bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-bl-none shadow-sm"
                }`}
              >
                {/* Tool Calling Execution Logs if any */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 pb-2 mb-2 border-b border-zinc-700">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                      Function Calling Executed:
                    </div>
                    {msg.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-[11px] text-zinc-300"
                      >
                        <span className="text-emerald-400 font-semibold">
                          {tc.toolName}
                        </span>
                        <span className="text-zinc-400">
                          ({JSON.stringify(tc.args)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                <div
                  className={`text-[10px] ${
                    msg.role === "user" ? "text-zinc-600" : "text-zinc-500"
                  } text-right`}
                >
                  {msg.timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-zinc-850 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
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
          className="mt-3 flex gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ketik instruksi (mis: Beli BBCA 10 lot di 9850, Portofolio saya gimana?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-zinc-400 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" /> Kirim
          </button>
        </form>
      </main>
    </div>
  );
}
