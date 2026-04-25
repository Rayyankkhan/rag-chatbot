import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Message from "./Message";
import DocumentPanel from "./DocumentPanel";
import { api } from "../utils/api";

const SUGGESTED = [
    "What are the admission requirements?",
    "How can I pay my fees online?",
    "What documents do I need to submit?",
    "Tell me about available courses",
];

const ChatApp = () => {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "👋 Hello! I'm the AI assistant. I can answer questions based on the uploaded documents and knowledge base. How can I help you today?",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text) => {
        const question = text || input.trim();
        if (!question || loading) return;

        setInput("");
        setLoading(true);

        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Add user message
        setMessages((prev) => [...prev, { role: "user", content: question, time }]);

        // Add placeholder assistant message
        const assistantId = uuidv4();
        setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: "", streaming: true, sources: [], time },
        ]);

        try {
            const response = await api.chatStream(question, sessionId);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.type === "error") {
                            const errorMsg =
                                data.code === "QUOTA_EXCEEDED"
                                    ? "⚠️ OpenAI API quota exceeded. Please check your plan or credits. Response cannot be generated at this time."
                                    : `❌ Error: ${data.message || "An unexpected error occurred."}`;

                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? { ...m, content: errorMsg, streaming: false }
                                        : m
                                )
                            );
                            break;
                        }

                        if (data.type === "sources") {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId ? { ...m, sources: data.sources } : m
                                )
                            );
                        } else if (data.type === "token") {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? { ...m, content: m.content + data.token }
                                        : m
                                )
                            );
                        } else if (data.type === "done") {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId ? { ...m, streaming: false } : m
                                )
                            );
                        }
                    } catch { }
                }
            }
        } catch (err) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? {
                            ...m,
                            content: "❌ Failed to connect to server. Please try again later.",
                            streaming: false,
                        }
                        : m
                )
            );
        }

        setLoading(false);
        inputRef.current?.focus();
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-300 overflow-hidden
          ${sidebarOpen ? "w-72" : "w-0"}`}
            >
                <div className="p-4 flex flex-col gap-6 h-full overflow-y-auto scrollbar-thin w-72">
                    {/* Logo */}
                    <div className="flex items-center gap-2 pt-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            R
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">RAG Assistant</p>
                            <p className="text-xs text-gray-500">Powered by OpenAI</p>
                        </div>
                    </div>

                    <DocumentPanel />

                    {/* Session info */}
                    <div className="mt-auto pt-4 border-t border-gray-800">
                        <p className="text-xs text-gray-600">Session</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{sessionId.slice(0, 16)}...</p>
                        <p className="text-xs text-gray-500 mt-1">{messages.length - 1} messages</p>
                    </div>
                </div>
            </aside>

            {/* Main chat */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
                    <button
                        onClick={() => setSidebarOpen((v) => !v)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        ☰
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-white">AI Knowledge Assistant</h1>
                        <p className="text-xs text-emerald-400">● Online · RAG Pipeline Active</p>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 flex flex-col gap-6">
                    {messages.map((msg, i) => (
                        <Message key={msg.id || i} msg={msg} />
                    ))}

                    {/* Suggestions — show only at start */}
                    {messages.length === 1 && (
                        <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
                            {SUGGESTED.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
                                    className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 hover:text-white transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-4 border-t border-gray-800 bg-gray-900">
                    <div className="flex gap-3 items-end max-w-4xl mx-auto">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask anything about the documents..."
                            rows={1}
                            className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 max-h-32 overflow-y-auto scrollbar-thin"
                            style={{ minHeight: "48px" }}
                            onInput={(e) => {
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="text-lg">↑</span>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-2">
                        Press Enter to send · Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;