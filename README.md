# StaffSync — HR Copilot AI

> A full-stack HR platform with an AI assistant powered by RAG (Retrieval-Augmented Generation), built on the MERN stack with MongoDB Atlas Vector Search and Google Gemini.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![MongoDB](https://img.shields.io/badge/database-MongoDB%20Atlas-brightgreen)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Authentication Flow](#authentication-flow)
- [RAG Pipeline](#rag-pipeline)
- [AI Chat Flow](#ai-chat-flow)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Project Overview

StaffSync is a full-stack HR management platform that combines traditional employee record management with an AI-powered HR assistant. Employees can ask natural-language questions about company policies, and the AI answers grounded in the organisation's own uploaded HR documents, with source citations so answers can be verified.

**Core capabilities:**
- Employee directory with full CRUD operations
- Role-based access (Admin / Employee)
- PDF knowledge base with automatic AI indexing
- RAG-based HR Copilot that answers questions grounded in company documents
- Conversation history, user feedback, and admin analytics

---

## Features

### 🔐 Authentication & RBAC
- JWT-based authentication with token refresh
- Two roles: **Admin** and **Employee**
- Admin: full CRUD, document management, analytics
- Employee: read-only access to own profile and documents

### 👥 Employee Management
- Create, read, update, delete employee records
- Search by name, email, job title (debounced, server-side)
- Server-side pagination
- Image URL avatars with fallback generation

### 📄 Knowledge Base (Document Management)
- Upload HR policy PDFs (up to 20 MB)
- Automatic background indexing via RAG pipeline
- Processing status tracking: `processing → ready | failed`
- Re-indexing support for failed documents
- Categories: Leave Policy, WFH, Insurance, Code of Conduct, Appraisal, Travel Policy, Benefits, IT Security, Payroll, Other

### 🤖 HR Copilot AI
- Natural-language Q&A grounded in uploaded documents
- Returns answer + source citations + confidence score
- In-memory answer cache (10-minute TTL)
- Cache invalidation on document changes

### 💬 Conversation History
- Every AI interaction persisted to MongoDB
- Admin: view all conversations
- Employee: view own conversations only
- Server-side search and pagination

### 👍 Feedback System
- Thumbs up / down per AI answer
- Optional free-text comment
- One rating per user per conversation (upsert)

### 📊 Admin Analytics
- Total conversations, users, documents, vector chunks
- Average confidence score
- Helpful/not-helpful feedback percentages
- Daily AI usage chart (last 30 days)
- Top referenced HR categories and documents
- Confidence distribution
- Recent activity feed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Forms | Formik |
| Charts | Recharts v3 |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (with Vector Search) |
| ODM | Mongoose 8 |
| Authentication | JSON Web Tokens (JWT) + bcryptjs |
| File Upload | Multer 2 |
| Validation | express-validator |
| Security | Helmet, express-rate-limit |
| AI Embeddings | Google Gemini `embedding-001` (768 dimensions) |
| AI Chat | Google Gemini `gemini-1.5-flash` |
| RAG Framework | LangChain.js (`@langchain/google-genai`, `@langchain/textsplitters`) |
| PDF Parsing | pdf-parse |
| Logging | Custom structured logger (dev: coloured, prod: JSON) |
| Dev Server | nodemon |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Client (Vite)                       │
│  NavBar · Sidebar · Pages · Auth Context · apiFetch utility     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST  (Bearer JWT)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express API Server                            │
│  Helmet · CORS · Rate Limiter · Auth Middleware · Routes        │
│                                                                  │
│  /api/v1/auth      /api/v1/employees   /api/v1/documents        │
│  /api/v1/chat      /api/v1/admin                                │
└───────┬───────────────────────────────────────┬─────────────────┘
        │ Mongoose                              │ LangChain.js
        ▼                                       ▼
┌────────────────────┐               ┌──────────────────────────┐
│   MongoDB Atlas    │               │   Google Gemini API       │
│                    │               │                          │
│  users             │               │  embedding-001 (768-dim) │
│  employees         │◄──────────────│  gemini-1.5-flash        │
│  documents         │  $vectorSearch│                          │
│  documentchunks    │               └──────────────────────────┘
│  conversations     │
│  feedback          │
└────────────────────┘
```

---

## Folder Structure

```
staffsync/
├── client/                          React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/                ChatMessage, FeedbackModal, SourceCard…
│   │   │   ├── documents/           UploadModal, CategoryBadge…
│   │   │   ├── MainSection/         Employee grid + CRUD modals
│   │   │   ├── ui/                  Spinner, Skeleton, Pagination
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── NavBar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx          (desktop + mobile drawer)
│   │   ├── config/
│   │   │   └── clientConfig.js      Centralised client constants
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useChatScroll.js
│   │   │   ├── useDebounce.js
│   │   │   └── usePagination.js
│   │   ├── pages/
│   │   │   ├── AICopilot.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── ChatHistory.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Unauthorized.jsx
│   │   └── utils/
│   │       ├── api.js               apiFetch wrapper + token handling
│   │       └── formatters.js
│   ├── .env.example
│   └── vite.config.js
│
├── server/                          Node.js + Express backend
│   ├── config/
│   │   └── serverConfig.js          Centralised server constants
│   ├── db/
│   │   └── index.js                 Mongoose connection
│   ├── middleware/
│   │   ├── authenticate.js          JWT verification
│   │   ├── authorize.js             Role guard factory
│   │   ├── authValidators.js
│   │   ├── documentValidators.js
│   │   ├── employeeValidators.js
│   │   ├── errorHandler.js          Centralised error handler
│   │   ├── rateLimiter.js           Auth + chat rate limits
│   │   ├── upload.js                Multer PDF config
│   │   └── validate.js
│   ├── models/
│   │   ├── Conversation.js
│   │   ├── Document.js
│   │   ├── DocumentChunk.js         Vector embeddings
│   │   ├── Employees.js
│   │   ├── Feedback.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js                 Analytics endpoint
│   │   ├── auth.js
│   │   ├── chat.js                  Chat + history + feedback
│   │   ├── createEmployee.js
│   │   ├── deleteEmployee.js
│   │   ├── documents.js
│   │   ├── getEmployeeById.js
│   │   ├── getEmployees.js
│   │   ├── searchEmployee.js
│   │   └── updateEmployee.js
│   ├── services/
│   │   ├── answerCache.js           In-memory TTL cache
│   │   ├── chatService.js           RAG pipeline
│   │   ├── documentProcessor.js     PDF → chunks → embeddings
│   │   ├── promptBuilder.js         Gemini system + user prompt
│   │   └── vectorService.js         Atlas Vector Search
│   ├── uploads/
│   │   └── hr-documents/            Stored PDFs (git-ignored)
│   ├── utils/
│   │   ├── escapeRegex.js
│   │   └── logger.js
│   ├── .env.example
│   └── index.js
│
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── authentication-flow.md
│   ├── database-design.md
│   ├── interview-notes.md
│   └── rag-flow.md
│
├── .gitignore
└── README.md
```

---

## Authentication Flow

```
1. User submits credentials → POST /api/v1/auth/login
2. Server verifies email + bcrypt password comparison
3. On success: JWT signed { id: userId } with 7-day expiry
4. Client stores token in localStorage (key: staffsync_token)
5. Every subsequent request: Authorization: Bearer <token>
6. authenticate middleware: verifies JWT → fetches fresh user from DB
7. authorize middleware: checks user.role against required roles
8. Token expiry: server returns 401 { code: 'TOKEN_EXPIRED' }
9. Client fires window event 'auth:expired' → AuthContext clears state → redirect to /login
```

---

## RAG Pipeline

```
PDF Upload
    │
    ├─ Multer: validate PDF, write UUID-named file to uploads/
    ├─ Document.create({ status: 'processing' })
    ├─ HTTP 201 returned immediately (non-blocking)
    │
    └─ Background: indexDocument(doc)
           │
           ├─ pdf-parse: extract raw text
           ├─ RecursiveCharacterTextSplitter (chunkSize: 800, overlap: 150)
           ├─ GoogleGenerativeAIEmbeddings.embedDocuments() in batches of 50
           ├─ DocumentChunk.insertMany() into MongoDB
           ├─ Document.status = 'ready', chunkCount = N
           └─ answerCache.invalidate() — stale answers cleared
```

---

## AI Chat Flow

```
User Question
    │
    ├─ answerCache.get(normalised question)  ── HIT ──► return cached answer
    │
    └─ MISS:
           │
           ├─ embedQuery(question) → 768-dim vector
           ├─ $vectorSearch (Atlas) → top-5 relevant chunks
           │
           ├─ No chunks? → "I couldn't find this information…"
           │
           └─ chunks found:
                  │
                  ├─ buildUserMessage(question, chunks)
                  ├─ ChatGoogleGenerativeAI.invoke([systemPrompt, userMessage])
                  ├─ Parse answer, deduplicate sources, score → confidence
                  ├─ answerCache.set(question, result)
                  └─ Conversation.create({ userId, question, answer, sources, confidence })
```

---

## Database Schema

See [docs/database-design.md](docs/database-design.md) for full schema details.

**Collections:**
| Collection | Purpose |
|---|---|
| `users` | Auth accounts (admin / employee) |
| `employees` | Employee HR records |
| `documents` | PDF metadata + processing status |
| `documentchunks` | Text chunks + 768-dim embeddings |
| `conversations` | Persisted AI Q&A turns |
| `feedback` | Per-user ratings on AI answers |

---

## API Endpoints

See [docs/api.md](docs/api.md) for full documentation.

**Quick reference:**

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register account |
| POST | `/api/v1/auth/login` | Public | Login |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| GET | `/api/v1/employees` | Admin | List employees (paginated) |
| GET | `/api/v1/employees/search` | Admin | Search employees |
| POST | `/api/v1/employees` | Admin | Create employee |
| PUT | `/api/v1/employees/:id` | Admin | Update employee |
| DELETE | `/api/v1/employees/:id` | Admin | Delete employee |
| GET | `/api/v1/documents` | Bearer | List documents (paginated) |
| POST | `/api/v1/documents/upload` | Admin | Upload PDF |
| PUT | `/api/v1/documents/:id` | Admin | Update metadata |
| DELETE | `/api/v1/documents/:id` | Admin | Delete document + chunks |
| GET | `/api/v1/documents/:id/download` | Bearer | Download PDF |
| POST | `/api/v1/documents/:id/reindex` | Admin | Re-trigger indexing |
| POST | `/api/v1/chat` | Bearer | Ask HR question |
| GET | `/api/v1/chat/history` | Bearer | Conversation history |
| DELETE | `/api/v1/chat/history/:id` | Bearer | Delete conversation |
| POST | `/api/v1/chat/feedback` | Bearer | Submit feedback |
| GET | `/api/v1/admin/analytics` | Admin | Platform analytics |

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=8000
NODE_ENV=development
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=<64-char random hex string>
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=<your Google Gemini API key>
GEMINI_CHAT_MODEL=gemini-1.5-flash
MONGODB_VECTOR_INDEX=document_vector_index
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (free M0 tier works)
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Clone and install

```bash
git clone <repo-url>
cd staffsync

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

# Client
cp client/.env.example client/.env
# Default VITE_API_URL=http://localhost:8000/api/v1 works for local dev
```

### 3. Create MongoDB Atlas Vector Search index

In Atlas UI → your cluster → **Search** → **Create Search Index** → **JSON Editor** on the `documentchunks` collection:

```json
{
  "name": "document_vector_index",
  "type": "vectorSearch",
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "metadata.category" },
    { "type": "filter", "path": "documentId" }
  ]
}
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. First-time setup
1. Navigate to `/register` → create your first **Admin** account.
2. Upload an HR policy PDF on the **Knowledge Base** page.
3. Wait for status to show 🟢 **Ready** (~10–30 seconds depending on PDF size).
4. Ask questions on the **HR Copilot** page.

---

## Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd client
vercel --prod
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

The included `vercel.json` handles SPA routing automatically.

### Backend → Render

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a new **Web Service**
3. Build command: `npm install`
4. Start command: `node index.js`
5. Set all environment variables from `server/.env.example`
6. Set `NODE_ENV=production`

The included `render.yaml` documents the service configuration.

### Database → MongoDB Atlas

- Use the M0 free tier for development
- Enable Network Access for Render's IP range (or `0.0.0.0/0` for simplicity)
- The Vector Search index must be created **before** uploading documents

---

## Screenshots

> _Add screenshots here after deployment_

| Page | Screenshot |
|---|---|
| Login | `docs/screenshots/login.png` |
| Dashboard | `docs/screenshots/dashboard.png` |
| Knowledge Base | `docs/screenshots/documents.png` |
| HR Copilot | `docs/screenshots/copilot.png` |
| Analytics | `docs/screenshots/analytics.png` |

---

## Future Improvements

- **Streaming responses** — stream Gemini output token-by-token for a better UX
- **OCR support** — index scanned / image-based PDFs using Google Document AI
- **Role management UI** — admin interface to manage user roles
- **Audit logging** — track all admin actions
- **Multi-tenant** — support multiple organisations in a single deployment
- **Email notifications** — notify users when documents finish indexing
- **Hybrid search** — combine vector search with BM25 keyword search for better recall
- **Document versioning** — track changes to HR policies over time

---

## License

MIT © 2024 StaffSync

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
