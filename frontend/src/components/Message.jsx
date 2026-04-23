import ReactMarkdown from "react-markdown";

const SourceBadge = ({ source }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs">
        📄 {source.filename?.split("/").pop() || "Source"}
    </span>
);

const Message = ({ msg }) => {
    const isUser = msg.role === "user";

    return (
        <div
            className={`flex gap-3 animate-slide-up ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        ${isUser ? "bg-indigo-600 text-white" : "bg-emerald-700 text-white"}`}
            >
                {isUser ? "U" : "AI"}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
                <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
                            ? "bg-indigo-600 text-white rounded-tr-sm"
                            : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700"
                        }`}
                >
                    {isUser ? (
                        <p>{msg.content}</p>
                    ) : (
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                code: ({ children }) => (
                                    <code className="bg-gray-900 px-1.5 py-0.5 rounded text-emerald-400 text-xs font-mono">
                                        {children}
                                    </code>
                                ),
                                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            }}
                        >
                            {msg.content}
                        </ReactMarkdown>
                    )}

                    {/* Streaming cursor */}
                    {msg.streaming && (
                        <span className="inline-block w-2 h-4 bg-emerald-400 animate-blink ml-1 align-middle" />
                    )}
                </div>

                {/* Sources */}
                {msg.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                        <span className="text-xs text-gray-500">Sources:</span>
                        {msg.sources.map((s, i) => (
                            <SourceBadge key={i} source={s} />
                        ))}
                    </div>
                )}

                <span className="text-xs text-gray-600 px-1">
                    {msg.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
};

export default Message;