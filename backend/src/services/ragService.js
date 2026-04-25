import dotenv from "dotenv";

import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document as LCDocument } from "@langchain/core/documents";
import mongoose from "mongoose";
import pdfParse from "pdf-parse";
import fs from "fs";

dotenv.config();

// ─── LLM & Embeddings ────────────────────────────────────────────────────────

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small", // cheaper, still excellent
});

const llm = new ChatOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    streaming: true,
    configuration: {
        baseURL: "https://api.groq.com/openai/v1",
    }
});

// ─── Vector Store ─────────────────────────────────────────────────────────────

const getVectorStore = () => {
    if (!mongoose.connection.db) {
        throw new Error("MongoDB connection not established");
    }
    return new MongoDBAtlasVectorSearch(embeddings, {
        collection: mongoose.connection.db.collection("document_vectors"),
        indexName: process.env.VECTOR_INDEX_NAME || "vector_index",
        textKey: "text",
        embeddingKey: "embedding",
    });
};

// ─── PDF Processing ───────────────────────────────────────────────────────────

export const processPDF = async (filePath, filename, documentId) => {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments(
        [pdfData.text],
        [{ source: filename, documentId: documentId.toString(), type: "pdf" }]
    );

    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(chunks);

    // Cleanup uploaded file after processing
    fs.unlinkSync(filePath);

    return {
        pageCount: pdfData.numpages,
        chunkCount: chunks.length,
    };
};

// ─── Knowledge Base (MongoDB text entries) ───────────────────────────────────

export const addKnowledgeToVectorStore = async (knowledge) => {
    const vectorStore = getVectorStore();

    const docs = knowledge.map(
        (k) =>
            new LCDocument({
                pageContent: `${k.title}\n\n${k.content}`,
                metadata: {
                    source: "knowledge_base",
                    knowledgeId: k._id.toString(),
                    category: k.category,
                    type: "knowledge",
                },
            })
    );

    await vectorStore.addDocuments(docs);
};

// ─── RAG Chain ────────────────────────────────────────────────────────────────

const systemPrompt = `You are a helpful AI assistant. Use the following retrieved context to answer the user's question accurately and concisely.

If the context doesn't contain enough information to answer the question, say so honestly — don't make up information.

Keep answers clear, structured, and professional. If listing steps or items, use bullet points.

Context:
{context}`;

const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", "{input}"],
]);

export const createRAGChain = async () => {
    const vectorStore = getVectorStore();
    const retriever = vectorStore.asRetriever({ k: 4 }); // top 4 chunks

    const documentChain = await createStuffDocumentsChain({ llm, prompt });
    const retrievalChain = await createRetrievalChain({
        combineDocsChain: documentChain,
        retriever,
    });

    return { retrievalChain, retriever };
};

// ─── Streaming Chat ───────────────────────────────────────────────────────────

export const streamChat = async (question, res) => {
    try {
        const { retrievalChain, retriever } = await createRAGChain();

        // Get sources first
        const relevantDocs = await retriever.getRelevantDocuments(question);
        const sources = relevantDocs.map((doc) => ({
            filename: doc.metadata.source,
            pageContent: doc.pageContent.substring(0, 150) + "...",
            score: doc.metadata.score || null,
        }));

        // Stream the response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");

        // Send sources first
        res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

        let fullAnswer = "";

        const stream = await retrievalChain.stream({ input: question });

        for await (const chunk of stream) {
            if (chunk.answer) {
                fullAnswer += chunk.answer;
                res.write(
                    `data: ${JSON.stringify({ type: "token", token: chunk.answer })}\n\n`
                );
            }
        }

        res.write(`data: ${JSON.stringify({ type: "done", fullAnswer })}\n\n`);
        res.end();

        return { answer: fullAnswer, sources };
    } catch (error) {
        console.error("RAG Stream Error:", error);

        let errorCode = "UNKNOWN_ERROR";
        let errorMessage = "An unexpected error occurred.";

        if (error.message?.includes("quota") || error.message?.includes("429")) {
            errorCode = "QUOTA_EXCEEDED";
            errorMessage = "OpenAI API quota exceeded. Please check your credits.";
        }

        if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
        }

        res.write(`data: ${JSON.stringify({ type: "error", code: errorCode, message: errorMessage })}\n\n`);
        res.end();

        throw error; // Rethrow to let controller know
    }
};