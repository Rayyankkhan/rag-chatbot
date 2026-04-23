import express from "express";
import {
    chat,
    getChatHistory,
    clearHistory,
    getSessions,
} from "../controllers/chatController.js";
import {
    uploadDocument,
    getDocuments,
    deleteDocument,
    upload,
} from "../controllers/documentController.js";
import {
    addKnowledge,
    getKnowledge,
    updateKnowledge,
    deleteKnowledge,
} from "../controllers/knowledgeController.js";

const router = express.Router();

// Chat routes
router.post("/chat", chat);
router.get("/chat/history/:sessionId", getChatHistory);
router.delete("/chat/history/:sessionId", clearHistory);
router.get("/chat/sessions", getSessions);

// Document routes
router.post("/documents/upload", upload.single("pdf"), uploadDocument);
router.get("/documents", getDocuments);
router.delete("/documents/:id", deleteDocument);

// Knowledge base routes
router.post("/knowledge", addKnowledge);
router.get("/knowledge", getKnowledge);
router.put("/knowledge/:id", updateKnowledge);
router.delete("/knowledge/:id", deleteKnowledge);

export default router;