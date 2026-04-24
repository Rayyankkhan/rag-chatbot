# AI RAG Chatbot

> Production-grade RAG (Retrieval-Augmented Generation) chatbot — **PDF uploads + MongoDB knowledge base + OpenAI streaming**.  
> Demo version of the AI assistant deployed at Jinnah University for Women, handling 200+ daily student queries.  
> Built by [Rayyan Ahmed Khan](https://rayyan-portfolio-omega.vercel.app/)

## ✨ Features

- **PDF ingestion** — Upload PDFs, auto-chunked via `RecursiveCharacterTextSplitter`, embedded with `text-embedding-3-small`
- **MongoDB Atlas Vector Search** — Semantic retrieval of top-4 relevant chunks per query
- **Knowledge base** — Add manual FAQ entries (alongside PDFs) via REST API
- **SSE streaming** — Token-by-token response like ChatGPT using Server-Sent Events
- **Source citations** — Every answer shows which document it came from
- **Chat history** — All sessions persisted in MongoDB
- **Dark UI** — Professional chat interface built with React + TailwindCSS

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/db.js              ← MongoDB connection
│   ├── models/index.js           ← Document, Chat, Knowledge schemas
│   ├── services/ragService.js    ← Core RAG: embeddings, vector store, streaming chain
│   ├── controllers/
│   │   ├── chatController.js     ← SSE streaming + history
│   │   ├── documentController.js ← PDF upload + multer + background processing
│   │   └── knowledgeController.js ← Manual KB CRUD
│   ├── routes/index.js           ← All API routes
│   └── server.js                 ← Express entry point
frontend/
├── src/
│   ├── components/
│   │   ├── ChatApp.jsx           ← Main chat UI with SSE streaming
│   │   ├── Message.jsx           ← Markdown message bubbles + source badges
│   │   └── DocumentPanel.jsx     ← Drag-drop PDF upload
│   └── utils/api.js              ← API layer
```

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, MongoDB Atlas account, OpenAI API key

**1. Backend setup**
```bash
cd backend
npm install
cp .env.example .env
# Fill in OPENAI_API_KEY and MONGODB_URI
npm run dev
```

**2. Frontend setup**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

**3. MongoDB Atlas — create Vector Search Index**

In Atlas UI → Search Indexes → Create Index on collection `document_vectors`:
```json
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 1536,
    "similarity": "cosine"
  }]
}
```
Name the index `vector_index`.

## 📡 API Endpoints

| Method | Endpoint                        | Description               |
|--------|---------------------------------|---------------------------|
| POST   | /api/chat                       | Stream chat response (SSE)|
| GET    | /api/chat/history/:sessionId    | Get chat history          |
| DELETE | /api/chat/history/:sessionId    | Clear chat history        |
| POST   | /api/documents/upload           | Upload PDF                |
| GET    | /api/documents                  | List documents            |
| DELETE | /api/documents/:id              | Delete document           |
| POST   | /api/knowledge                  | Add knowledge entry       |
| GET    | /api/knowledge                  | List knowledge entries    |
| DELETE | /api/knowledge/:id              | Delete knowledge entry    |

## 🛠️ Tech Stack

| Tech                     | Purpose                     |
|--------------------------|-----------------------------|
| Node.js + Express        | Backend API                 |
| LangChain.js             | RAG orchestration           |
| OpenAI API               | Embeddings + GPT-3.5-turbo  |
| MongoDB Atlas            | Vector store + Chat history |
| React + Vite             | Frontend                    |
| TailwindCSS              | Styling                     |
| Multer + pdf-parse       | PDF upload & text extraction|
| SSE (Server-Sent Events) | Streaming responses         |

---

Made with ❤️ by Rayyan Ahmed Khan | 🔗 [Rayyan Ahmed Khan](https://rayyan-portfolio-omega.vercel.app/)
