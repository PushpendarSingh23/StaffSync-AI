# Architecture Overview

## System Architecture

```mermaid
graph TB
    subgraph Client["React Client (Vite + Tailwind)"]
        UI[Pages & Components]
        AC[AuthContext]
        AP[apiFetch utility]
    end

    subgraph Server["Express API Server (Node.js)"]
        MW[Middleware Stack\nHelmet · CORS · Rate Limit · JWT]
        RT[Route Handlers]
        SV[Services Layer\nchatService · documentProcessor · vectorService]
        CA[Answer Cache\nTTL Map]
    end

    subgraph DB["MongoDB Atlas"]
        COL[Collections\nusers · employees · documents\ndocumentchunks · conversations · feedback]
        VS[Atlas Vector Search Index\n768-dim cosine similarity]
    end

    subgraph AI["Google AI APIs"]
        EM[Gemini embedding-001\n768-dim vectors]
        CH[Gemini gemini-1.5-flash\nChat completions]
    end

    UI --> AP --> MW --> RT --> SV
    SV --> COL
    SV --> VS
    SV --> EM
    SV --> CH
    CA -.cached answers.-> SV
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant Express
    participant Mongoose
    participant Gemini

    Browser->>Express: POST /api/v1/chat { question }
    Express->>Express: authenticate (JWT verify)
    Express->>Express: chatLimiter (rate check)
    Express->>Express: answerCache.get(question)

    alt Cache HIT
        Express-->>Browser: { answer, sources, confidence }
    else Cache MISS
        Express->>Gemini: embedQuery(question)
        Gemini-->>Express: [768-dim vector]
        Express->>Mongoose: $vectorSearch (top-5 chunks)
        Mongoose-->>Express: chunks[]
        Express->>Gemini: invoke([systemPrompt, userMessage])
        Gemini-->>Express: answer string
        Express->>Mongoose: Conversation.create(...)
        Express->>Express: answerCache.set(question, result)
        Express-->>Browser: { answer, sources, confidence, conversationId }
    end
```

## Folder Architecture

```
staffsync/
├── client/          React SPA
│   └── src/
│       ├── components/   Reusable UI components
│       ├── config/       Client-side constants
│       ├── context/      React Context (Auth)
│       ├── hooks/        Custom React hooks
│       ├── pages/        Route-level page components
│       └── utils/        API helper, formatters
│
├── server/          Express REST API
│   ├── config/      Server constants (no magic numbers)
│   ├── db/          Mongoose connection
│   ├── middleware/  Auth, validation, upload, rate limiting
│   ├── models/      Mongoose schemas
│   ├── routes/      Express route handlers
│   ├── services/    Business logic (AI, cache, vector)
│   └── utils/       Logger, regex escape
│
└── docs/            Architecture & API documentation
```

## Technology Decisions

| Decision | Rationale |
|---|---|
| MongoDB Atlas | Native Vector Search avoids a separate vector DB |
| Gemini `embedding-001` | 768-dim, fast, free tier available |
| LangChain.js | Abstracts embeddings/chat model, easy to swap providers |
| Express modular routes | One file per resource — easy to locate and maintain |
| In-process TTL cache | Avoids Redis dependency for a single-server deployment |
| Fire-and-forget indexing | HTTP response never blocked by slow PDF processing |
| `select: false` on password | Defence-in-depth — password never leaks through query results |
