import { streamChat } from "../services/ragService.js";
import { Chat } from "../models/index.js";
import { v4 as uuidv4 } from "uuid";

// POST /api/chat  — streaming SSE response
export const chat = async (req, res) => {
    const { message, sessionId } = req.body;

    if (!message?.trim()) {
        return res.status(400).json({ error: "Message is required" });
    }

    const sid = sessionId || uuidv4();

    try {
        // Save user message
        await Chat.create({ sessionId: sid, role: "user", content: message });

        // Stream response (sets headers internally)
        const { answer, sources } = await streamChat(message, res);

        // Save assistant response
        await Chat.create({
            sessionId: sid,
            role: "assistant",
            content: answer,
            sources,
        });
    } catch (error) {
        console.error("Chat error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to process message" });
        }
    }
};

// GET /api/chat/history/:sessionId
export const getChatHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = await Chat.find({ sessionId })
            .sort({ createdAt: 1 })
            .limit(50);
        res.json({ success: true, history, sessionId });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
};

// DELETE /api/chat/history/:sessionId
export const clearHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await Chat.deleteMany({ sessionId });
        res.json({ success: true, message: "History cleared" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear history" });
    }
};

// GET /api/chat/sessions  — list all sessions (admin)
export const getSessions = async (req, res) => {
    try {
        const sessions = await Chat.aggregate([
            {
                $group: {
                    _id: "$sessionId",
                    messageCount: { $sum: 1 },
                    lastMessage: { $max: "$createdAt" },
                    firstMessage: { $min: "$createdAt" },
                },
            },
            { $sort: { lastMessage: -1 } },
            { $limit: 100 },
        ]);
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
};