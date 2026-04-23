import mongoose from "mongoose";

// Stores metadata about uploaded PDFs
const documentSchema = new mongoose.Schema(
    {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        fileSize: { type: Number },
        pageCount: { type: Number },
        chunkCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["processing", "ready", "failed"],
            default: "processing",
        },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Stores chat history
const chatSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, index: true },
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        sources: [
            {
                filename: String,
                pageContent: String,
                score: Number,
            },
        ],
    },
    { timestamps: true }
);

// Stores knowledge base items (manual entries alongside PDFs)
const knowledgeSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        category: {
            type: String,
            enum: ["faq", "policy", "general", "fee", "admission"],
            default: "general",
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
export const Chat = mongoose.model("Chat", chatSchema);
export const Knowledge = mongoose.model("Knowledge", knowledgeSchema);