# StaffSync AI — AI-Powered Employee Management Platform

StaffSync AI is an enterprise-grade Employee Management Platform combining full-stack HR operations with a Retrieval-Augmented Generation (RAG) AI Copilot. Built with Node.js, Express.js, MongoDB Atlas Vector Search, and React.js, the system provides role-based access control, search-enabled REST APIs across 11 route modules, and an intelligent HR policy assistant powered by Google Gemini and LangChain.

---

## 🌟 Key Features

### 🏢 Full-Stack HR Operations
- **Role-Based Access Control (RBAC):** Granular authorization separating Super Admin, Admin, Manager, and Employee workflows.
- **RESTful API Architecture:** 11 modular REST API routes handling user authentication, employee profiles, department hierarchies, attendance, leave requests, performance reviews, and payroll.
- **Secure Authentication:** Cookie-based and header-based JWT authentication with bcrypt password hashing (cost factor 12).

### 🤖 AI-Powered HR Policy Copilot (RAG)
- **Document Ingestion & Chunking:** Processes HR policy PDFs by chunking text into 800-character segments with 150-character overlap using LangChain's RecursiveCharacterTextSplitter.
- **OCR Fallback Pipeline:** Python-based OCR fallback leveraging Tesseract to extract text from scanned or non-searchable PDF documents before vectorization.
- **Vector Search:** Embeds text chunks using Google Gemini's `embedding-001` model and indexes them into **MongoDB Atlas Vector Search**.
- **Two-Stage Retrieval & Reranking:** Widens initial vector retrieval to a candidate pool of 20 chunks before applying a cross-encoder reranking stage to select the top 5 most relevant contexts.
- **Grounded Generation:** Synthesizes cited, confidence-scored responses using **Gemini 1.5 Flash** with zero hallucination enforcement against policy documents.

### 🐳 DevOps & Deployment
- **Containerized Stack:** Dockerized client and server environments configured via `docker-compose.yml`.
- **CI/CD Pipeline:** Automated build, linting, testing, and deployment via GitHub Actions (`.github/workflows/deploy.yml`).
- **Cloud Storage:** Amazon S3 integration for secure employee document uploads.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Context API
- **Backend:** Node.js, Express.js, Python (OCR Scripting)
- **AI & RAG:** LangChain, Google Gemini API (`gemini-1.5-flash`, `embedding-001`), Cross-Encoder Reranker
- **Database & Search:** MongoDB Atlas, MongoDB Atlas Vector Search
- **Authentication:** JWT, bcrypt
- **DevOps & Infrastructure:** Docker, Docker Compose, AWS S3, GitHub Actions CI/CD

---

## 📁 Repository Structure

```
StaffSync-AI/
├── client/                 # React.js + Vite Frontend
│   ├── src/                # Components, Contexts, Pages, Hooks
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js + Express.js Backend
│   ├── config/             # DB, S3, and Server Configurations
│   ├── controllers/        # Route Handlers & Business Logic
│   ├── middleware/         # Auth & RBAC Middlewares
│   ├── models/             # Mongoose Schemas (User, Employee, Policy, etc.)
│   ├── routes/             # 11 REST API Route Modules
│   ├── services/           # Chat & RAG Vector Search Services
│   ├── scripts/            # Policy Chunking, Embedding & Eval Scripts
│   ├── Dockerfile
│   └── package.json
├── docs/                   # API Spec, Architecture & DB Diagrams
├── docker-compose.yml      # Local Container Orchestration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v18+`
- **MongoDB Atlas Cluster:** With Vector Search index enabled
- **Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)

---

### Environment Setup

#### Server Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/StaffSync
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=staffsync-documents
```

#### Client Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Local Installation & Running

#### 1. Backend Server
```bash
cd server
npm install
npm run dev
```

#### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```

---

### 🐳 Running with Docker

To spin up the entire application stack (Client + Server + MongoDB connectivity) locally using Docker:

```bash
docker-compose up --build
```

---

## 📜 License

This project is licensed under the MIT License.
