const BASE = import.meta.env.VITE_API_URL || "/api";

export const api = {
    // Chat — returns EventSource for streaming
    chatStream: (message, sessionId) => {
        return fetch(`${BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, sessionId }),
        });
    },

    getChatHistory: (sessionId) =>
        fetch(`${BASE}/chat/history/${sessionId}`).then((r) => r.json()),

    clearHistory: (sessionId) =>
        fetch(`${BASE}/chat/history/${sessionId}`, { method: "DELETE" }).then((r) =>
            r.json()
        ),

    // Documents
    uploadPDF: (file) => {
        const form = new FormData();
        form.append("pdf", file);
        return fetch(`${BASE}/documents/upload`, { method: "POST", body: form }).then(
            (r) => r.json()
        );
    },

    getDocuments: () => fetch(`${BASE}/documents`).then((r) => r.json()),

    deleteDocument: (id) =>
        fetch(`${BASE}/documents/${id}`, { method: "DELETE" }).then((r) => r.json()),

    // Knowledge
    getKnowledge: () => fetch(`${BASE}/knowledge`).then((r) => r.json()),

    addKnowledge: (data) =>
        fetch(`${BASE}/knowledge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then((r) => r.json()),

    deleteKnowledge: (id) =>
        fetch(`${BASE}/knowledge/${id}`, { method: "DELETE" }).then((r) => r.json()),
};