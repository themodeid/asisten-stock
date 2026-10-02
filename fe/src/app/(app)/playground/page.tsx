"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { api } from "@/services/api";
import { Send, Bot, User, Sparkles, Terminal, RefreshCw, Cpu, Trash2, ImagePlus, Copy, Check } from "lucide-react";

interface Message {
 id: string;
 role: "user" | "assistant";
 text: string;
 toolCalls?: { toolName: string; args: any; result: any }[];
 timestamp: Date;
}

const DEFAULT_WELCOME: Message = {
 id: "welcome",
 role: "assistant",
 text: "🏛️ **Asisten+Stock Sovereign Terminal Advisor**\n\nSelamat datang di terminal eksekutif portofolio Anda. Saya siap membantu Anda menganalisis pasar modal global, mengeksekusi rebalancing, mencatat order multi-aset, maupun mendiskusikan dinamika makroekonomi:\n\n• **Diskusi Makro & Pasar**: *\"Apakah sekarang bursa saham Amerika akan turun karena bubble AI seperti tahun 98?\"*\n• **Riset Fundamental & Moat**: *\"Analisa fundamental Apple (AAPL) dan Microsoft\"*\n• **Saran Rebalancing**: *\"Saya ada modal dingin 2 juta, sarankan alokasi seimbang\"*\n• **Pencatatan Order Cepat**: *\"Beli VT 600 ribu\"* atau *\"Beli BTC 1.500.000\"*\n\nTopik atau aset apa yang ingin Anda eksplorasi hari ini?",
 timestamp: new Date("2026-01-01T00:00:00Z"),
};

const SAMPLE_PROMPTS = [
 "Apakah bursa saham AS akan turun karena bubble AI seperti tahun 98?",
 "Analisa ETF VT (Vanguard Total World)",
 "Beli VT 630 ribu rupiah",
 "Beli BTC 1.100.000 rupiah",
 "Beli Emas Antam 3 juta",
 "Alokasi modal dingin 2 juta rupiah",
];

const LOCAL_STORAGE_KEY = "asisten_stock_chat_history_v2";

export default function PlaygroundPage() {
 const { user } = useAuth();
 const [mounted, setMounted] = useState(false);
 const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
 const [input, setInput] = useState("");
 const [loading, setLoading] = useState(false);
 const [clearing, setClearing] = useState(false);
 const [copiedId, setCopiedId] = useState<string | null>(null);
 const chatEndRef = useRef<HTMLDivElement>(null);

 const handleCopyText = (id: string, text: string) => {
 if (typeof navigator !== "undefined" && navigator.clipboard) {
 navigator.clipboard.writeText(text);
 setCopiedId(id);
 setTimeout(() => {
 setCopiedId(null);
 }, 2000);
 }
 };

 // 1. Initial Load: Load from localStorage only on client after mount, then sync with backend
 useEffect(() => {
 setMounted(true);
 try {
 const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
 if (saved) {
 const parsed = JSON.parse(saved);
 if (Array.isArray(parsed) && parsed.length > 0) {
 setMessages(
 parsed.map((m: any) => ({
 ...m,
 timestamp: new Date(m.timestamp),
 }))
 );
 }
 }
 } catch (e) {
 console.warn("Failed to load local chat storage", e);
 }

 // Sync from database
 const syncBackendLogs = async () => {
 try {
 const res = await api.get(`/gemini/logs/${user?.id || 1}`);
 const logs = res.data?.data;
 if (Array.isArray(logs) && logs.length > 0) {
 const mapped: Message[] = logs.map((log: any) => {
 let tools = [];
 if (log.tool_calls) {
 try {
 tools = typeof log.tool_calls === "string" ? JSON.parse(log.tool_calls) : log.tool_calls;
 } catch (_) {}
 }
 return {
 id: log.id?.toString() || Math.random().toString(),
 role: log.role as "user" | "assistant",
 text: log.message,
 toolCalls: Array.isArray(tools) ? tools : [],
 timestamp: new Date(log.created_at),
 };
 });
 setMessages(mapped);
 localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
 }
 } catch (err) {
 console.warn("Could not sync chat logs from backend:", err);
 }
 };

 syncBackendLogs();
 }, []);

 // 2. Save messages to localStorage whenever messages update
 useEffect(() => {
 chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
 if (messages.length > 0) {
 try {
 localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
 } catch (e) {
 console.warn("Failed to save to localStorage:", e);
 }
 }
 }, [messages]);

 const handleClearChat = async () => {
 if (confirm("Apakah Anda yakin ingin membersihkan riwayat chat?")) {
 setClearing(true);
 try {
 await api.delete(`/gemini/logs/${user?.id || 1}`);
 } catch (err) {
 console.warn("Failed to delete remote logs", err);
 }
 localStorage.removeItem(LOCAL_STORAGE_KEY);
 setMessages([DEFAULT_WELCOME]);
 setClearing(false);
 }
 };

 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file || loading) return;

 const userMsg: Message = {
 id: Date.now().toString(),
 role: "user",
 text: `📷 *Mengunggah & menganalisis bukti transaksi:* **${file.name}**`,
 timestamp: new Date(),
 };

 setMessages((prev) => [...prev, userMsg]);
 setLoading(true);

 const formData = new FormData();
 formData.append("image", file);
 formData.append("user_id", String(user?.id || 1));

 try {
 const res = await api.post("/gemini/ocr-transaction", formData, {
 headers: { "Content-Type": "multipart/form-data" },
 });

 const data = res.data?.data;
 const tx = data?.transaction;
 const holding = data?.holding;
 const isStock = tx?.asset_type === "STOCK";
 const qtyText = isStock ? `${tx?.lots} Lot (${tx?.shares} lbr)` : `${tx?.quantity} unit`;

 const botMsg: Message = {
 id: (Date.now() + 1).toString(),
 role: "assistant",
 text: `🤖 **AI Vision OCR: Struk Transaksi Berhasil Diekstrak & Dicatat!**\n\n📋 **Data Hasil Scan AI:**\n• **Aset:** \`${tx?.ticker}\` (${tx?.asset_type})\n• **Jenis Transaksi:** **${tx?.type}**\n• **Kuantitas:** **${qtyText}**\n• **Harga Satuan:** **${tx?.currency === "USD" ? `$${tx?.price_per_share}` : `Rp ${Number(tx?.price_per_share).toLocaleString("id-ID")}`}**\n• **Total Realisasi:** **${tx?.currency === "USD" ? `$${tx?.total_amount}` : `Rp ${Number(tx?.total_amount).toLocaleString("id-ID")}`}**\n• **Catatan:** *${tx?.notes || "Struk Transaksi"}*\n\n✨ *Portofolio Anda telah diperbarui secara instan dari bukti gambar.*`,
 toolCalls: [
 {
 toolName: "ocr_image_transaction",
 args: { file_name: file.name },
 result: data,
 },
 ],
 timestamp: new Date(),
 };

 setMessages((prev) => [...prev, botMsg]);
 } catch (err: any) {
 const errorMsg: Message = {
 id: (Date.now() + 1).toString(),
 role: "assistant",
 text: `❌ Gagal memproses gambar struk: ${err.response?.data?.message || err.message}`,
 timestamp: new Date(),
 };
 setMessages((prev) => [...prev, errorMsg]);
 } finally {
 setLoading(false);
 if (fileInputRef.current) fileInputRef.current.value = "";
 }
 };

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
 user_id: user?.id || 1,
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
 <div className="flex-1 flex flex-col h-full overflow-hidden">
 <div className="flex items-center justify-between border-b border-[#30363d] bg-[#0d1117]/90 px-6 py-4 sticky top-0 z-20 shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#f0f6fc] font-bold shadow-sm">
 <Bot className="w-5 h-5 text-[#3fb950]" />
 </div>
 <div>
 <h1 className="text-base font-semibold text-[#f0f6fc] flex items-center gap-2">
 Asisten+Stock Multi-Asset Assistant
 <Badge variant="success" size="sm">Online</Badge>
 </h1>
 <p className="text-xs text-[#8b949e]">
 Asisten pribadi otomatis untuk Saham, Kripto, Emas, Obligasi, dan ETF
 </p>
 </div>
 </div>

 <button
 onClick={handleClearChat}
 disabled={clearing || messages.length <= 1}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#0d1117] hover:bg-[#161b22] text-[#8b949e] hover:text-[#c9d1d9] text-xs transition disabled:opacity-40"
 title="Bersihkan riwayat chat"
 >
 <Trash2 className="w-3.5 h-3.5 text-[#8b949e]" />
 <span>Bersihkan Chat</span>
 </button>
 </div>

 <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto flex flex-col min-h-0 overflow-hidden">
 {/* Quick Suggestion Chips */}
 <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
 <span className="text-xs text-[#8b949e] font-medium flex items-center gap-1 shrink-0">
 <Sparkles className="w-3.5 h-3.5 text-[#c9d1d9]" /> Contoh Prompt:
 </span>
 {SAMPLE_PROMPTS.map((p) => (
 <button
 key={p}
 onClick={() => handleSend(p)}
 disabled={loading}
 className="px-2.5 py-1 rounded-md bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] text-[11px] text-[#c9d1d9] whitespace-nowrap transition"
 >
 {p}
 </button>
 ))}
 </div>

 {/* Chat History Box */}
 <div className="flex-1 bg-[#0d1117]/65 border border-[#30363d] rounded-md p-4 md:p-6 overflow-y-auto space-y-4 shadow-sm">
 {messages.map((msg) => (
 <div
 key={msg.id}
 className={`flex gap-3 ${
 msg.role === "user" ? "justify-end" : "justify-start"
 }`}
 >
 {msg.role === "assistant" && (
 <div className="w-8 h-8 rounded-md bg-[#161b22] border border-[#30363d]/80 flex items-center justify-center text-[#c9d1d9] shrink-0">
 <Bot className="w-4 h-4" />
 </div>
 )}

 <div
 className={`max-w-2xl p-3.5 space-y-2.5 ${
 msg.role === "user"
 ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-[#f0f6fc] rounded-md rounded-br-none font-medium shadow-[0_0_20px_rgba(59,130,246,0.3)]"
 : "bg-[#161b22] border border-[#30363d] text-[#f0f6fc] rounded-md rounded-bl-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
 }`}
 >
 {/* Tool Calling Execution Logs if any */}
 {msg.toolCalls && msg.toolCalls.length > 0 && (
 <div className="space-y-1.5 pb-2 mb-2 border-b border-[#30363d]">
 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c9d1d9]">
 <Cpu className="w-3.5 h-3.5 text-[#8b949e]" />
 Function Calling Executed:
 </div>
 {msg.toolCalls.map((tc, idx) => (
 <div
 key={idx}
 className="bg-[#0d1117]/50 border border-[#238636]/40 text-[#3fb950] rounded-md p-2 font-mono text-[11px]"
 >
 <span className="font-semibold">
 {tc.toolName}
 </span>
 <span className="text-[#8b949e]">
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
 className={`flex items-center justify-between pt-1 border-t ${
 msg.role === "user" ? "border-zinc-200/40" : "border-[#30363d]/80"
 } text-[10px] ${
 msg.role === "user" ? "text-[#6e7681]" : "text-[#8b949e]"
 }`}
 >
 <button
 type="button"
 onClick={() => handleCopyText(msg.id, msg.text)}
 className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
 copiedId === msg.id
 ? "text-[#3fb950] bg-[#238636]/15/40 font-semibold"
 : msg.role === "user"
 ? "text-[#6e7681] hover:text-zinc-900 hover:bg-zinc-200"
 : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
 }`}
 title="Salin isi pesan"
 >
 {copiedId === msg.id ? (
 <>
 <Check className="w-3 h-3 text-[#3fb950]" />
 <span>Tersalin</span>
 </>
 ) : (
 <>
 <Copy className="w-3 h-3" />
 <span>Salin</span>
 </>
 )}
 </button>

 <span suppressHydrationWarning>
 {mounted
 ? msg.timestamp.toLocaleTimeString("id-ID", {
 hour: "2-digit",
 minute: "2-digit",
 })
 : ""}
 </span>
 </div>
 </div>

 {msg.role === "user" && (
 <div className="w-8 h-8 rounded-md bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#c9d1d9] shrink-0">
 <User className="w-4 h-4" />
 </div>
 )}
 </div>
 ))}

 {loading && (
 <div className="flex gap-3 justify-start items-center">
 <div className="w-8 h-8 rounded-md bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#c9d1d9] shrink-0">
 <Bot className="w-4 h-4" />
 </div>
 <div className="bg-[#161b22] border border-[#30363d] rounded-md px-3.5 py-2 text-xs text-[#8b949e] flex items-center gap-2">
 <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c9d1d9]" />
 Asisten+Stock AI sedang memproses dan mengeksekusi tools...
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
 className="mt-3 flex items-center gap-2 shrink-0"
 >
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleImageUpload}
 accept="image/*"
 className="hidden"
 />

 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={loading}
 className="p-2.5 rounded-md bg-[#0d1117] hover:bg-[#161b22] border border-[#30363d] hover:border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] transition shadow-sm flex items-center justify-center shrink-0"
 title="Upload Bukti / Struk Transaksi (AI OCR Scan)"
 >
 <ImagePlus className="w-4 h-4 text-[#3fb950]" />
 </button>

 <input
 type="text"
 placeholder="Ketik instruksi (mis: Beli BBCA 10 lot di 9850) atau upload struk transaksi..."
 value={input}
 onChange={(e) => setInput(e.target.value)}
 disabled={loading}
 className="flex-1 bg-[#0d1117] border border-[#30363d] text-[#f0f6fc] placeholder-zinc-500 text-xs sm:text-sm rounded-md px-4 py-2.5 focus:outline-none focus-within:border-[#238636]/40 transition"
 />

 <button
 type="submit"
 disabled={loading || !input.trim()}
 className="px-5 py-2.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs shadow-[0_1px_0_rgba(27,31,36,0.1)] transition disabled:opacity-50 flex items-center gap-1.5 border border-[rgba(240,246,252,0.1)] active:scale-[0.98] shrink-0"
 >
 <Send className="w-3.5 h-3.5" /> Kirim
 </button>
 </form>
 </main>
 </div>
 );
}
