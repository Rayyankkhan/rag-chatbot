import { Knowledge } from "../models/index.js";
import { addKnowledgeToVectorStore } from "../services/ragService.js";

// POST /api/knowledge
export const addKnowledge = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }

        const knowledge = await Knowledge.create({ title, content, category });

        // Add to vector store
        await addKnowledgeToVectorStore([knowledge]);

        res.status(201).json({ success: true, knowledge });
    } catch (error) {
        res.status(500).json({ error: "Failed to add knowledge" });
    }
};

// GET /api/knowledge
export const getKnowledge = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category, isActive: true } : { isActive: true };
        const knowledge = await Knowledge.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, knowledge });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch knowledge" });
    }
};

// PUT /api/knowledge/:id
export const updateKnowledge = async (req, res) => {
    try {
        const knowledge = await Knowledge.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!knowledge) return res.status(404).json({ error: "Not found" });
        res.json({ success: true, knowledge });
    } catch (error) {
        res.status(500).json({ error: "Failed to update knowledge" });
    }
};

// DELETE /api/knowledge/:id
export const deleteKnowledge = async (req, res) => {
    try {
        await Knowledge.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
};