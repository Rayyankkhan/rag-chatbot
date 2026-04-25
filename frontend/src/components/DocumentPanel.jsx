import { useState, useEffect } from "react";
import { api } from "../utils/api";

const DocumentPanel = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const loadDocuments = async () => {
        const res = await api.getDocuments();
        if (res.success) setDocuments(res.documents);
    };

    useEffect(() => { loadDocuments(); }, []);

    const handleUpload = async (file) => {
        if (!file || file.type !== "application/pdf") {
            alert("Please upload a PDF file");
            return;
        }
        setUploading(true);
        const res = await api.uploadPDF(file);
        if (res.success) {
            alert(`✅ "${res.filename}" uploaded! Processing in background...`);
            setTimeout(loadDocuments, 2000);
        } else {
            alert("Upload failed");
        }
        setUploading(false);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        await api.deleteDocument(id);
        loadDocuments();
    };

    const statusColor = {
        ready: "text-emerald-400",
        processing: "text-yellow-400",
        failed: "text-red-400",
    };

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                PDF Documents
            </h3>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleUpload(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragOver ? "border-indigo-500 bg-indigo-950/30" : "border-gray-700 hover:border-gray-500"}`}
                onClick={() => document.getElementById("pdf-input").click()}
            >
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm text-gray-400">
                    {uploading ? "Uploading..." : "Drop PDF here or click to upload"}
                </p>
                <p className="text-xs text-gray-600 mt-1">Max 10MB</p>
                <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files[0])}
                />
            </div>

            {/* Document List */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin">
                {documents.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-2">No documents yet</p>
                )}
                {documents.map((doc) => (
                    <div
                        key={doc._id}
                        className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 group"
                    >
                        <span className="text-sm">📄</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-200 truncate">{doc.originalName}</p>
                            <p className={`text-xs ${statusColor[doc.status] || "text-gray-500"}`}>
                                {doc.status} {doc.chunkCount ? `· ${doc.chunkCount} chunks` : ""}
                            </p>
                        </div>
                        <button
                            onClick={() => handleDelete(doc._id, doc.originalName)}
                            className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentPanel;