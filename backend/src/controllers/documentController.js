import { processPDF } from "../services/ragService.js";
import { Document } from "../models/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ─── Multer Setup ─────────────────────────────────────────────────────────────

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/documents/upload
export const uploadDocument = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Create doc record first
    const doc = await Document.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        status: "processing",
    });

    // Respond immediately, process in background
    res.json({
        success: true,
        message: "PDF uploaded and processing started",
        documentId: doc._id,
        filename: req.file.originalname,
    });

    // Background processing
    try {
        const { pageCount, chunkCount } = await processPDF(
            req.file.path,
            req.file.originalname,
            doc._id
        );

        await Document.findByIdAndUpdate(doc._id, {
            status: "ready",
            pageCount,
            chunkCount,
        });

        console.log(
            `✅ Processed: ${req.file.originalname} — ${chunkCount} chunks`
        );
    } catch (error) {
        await Document.findByIdAndUpdate(doc._id, { status: "failed" });
        console.error("PDF processing failed:", error);
    }
};

// GET /api/documents
export const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find().sort({ createdAt: -1 });
        res.json({ success: true, documents });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: "Document not found" });

        // Note: vectors remain in Atlas — add cleanup logic if needed
        res.json({ success: true, message: "Document deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete document" });
    }
};
