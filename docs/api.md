# API Documentation

**Base URL:** `http://localhost:8000/api/v1`  
**Production:** Set via `VITE_API_URL` environment variable

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication

### POST `/auth/register`
Register a new user account.

**Auth:** Public (rate-limited: 10 req / 15 min per IP)

**Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass1",
  "role": "employee"
}
```

> Creating an `admin` role requires either: no admin exists yet (first setup), or an authenticated admin making the request.

**Response 201:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "_id": "...", "fullName": "Jane Smith", "email": "jane@example.com", "role": "employee" }
}
```

**Errors:** `409` email exists · `422` validation failed · `403` unauthorized admin creation

---

### POST `/auth/login`
Authenticate and receive a JWT.

**Auth:** Public (rate-limited: 10 req / 15 min per IP)

**Body:**
```json
{ "email": "jane@example.com", "password": "SecurePass1" }
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "_id": "...", "fullName": "Jane Smith", "role": "employee" }
}
```

**Errors:** `401` invalid credentials · `422` validation failed

---

### GET `/auth/me`
Return the currently authenticated user.

**Auth:** Bearer

**Response 200:**
```json
{ "success": true, "user": { "_id": "...", "fullName": "...", "role": "admin" } }
```

**Errors:** `401` no/invalid token

---

## Employees

### GET `/employees?page=1&limit=20`
List employees with pagination. Admin only.

**Auth:** Bearer (Admin)

**Query Params:** `page`, `limit`

**Response 200:**
```json
{
  "success": true,
  "data": [{ "_id": "...", "firstname": "...", ... }],
  "pagination": { "total": 45, "page": 1, "limit": 20, "pages": 3 }
}
```

---

### GET `/employees/search?q=john&page=1&limit=20`
Search employees by name, email, or job title. Admin only.

**Auth:** Bearer (Admin)

**Query Params:** `q` (search term), `page`, `limit`

**Response 200:** Same shape as list endpoint.

---

### GET `/employees/:id`
Get a single employee. Admin gets any; employee gets their linked record only.

**Auth:** Bearer

**Response 200:**
```json
{ "success": true, "data": { "_id": "...", "firstname": "...", ... } }
```

**Errors:** `403` employee accessing another record · `404` not found

---

### POST `/employees`
Create a new employee. Admin only.

**Auth:** Bearer (Admin)

**Body:**
```json
{
  "firstname": "John", "lastname": "Doe",
  "email": "john@company.com", "phone": "+1234567890",
  "job": "Software Engineer", "dateOfJoining": "2024-01-15",
  "image": "https://example.com/photo.jpg"
}
```

**Response 201:** `{ "success": true, "data": { ... } }`

**Errors:** `409` email exists · `422` validation

---

### PUT `/employees/:id`
Update an employee. Admin only.

**Auth:** Bearer (Admin)

**Body:** Any subset of employee fields (all optional).

**Response 200:** `{ "success": true, "data": { ... } }`

---

### DELETE `/employees/:id`
Delete an employee. Admin only.

**Auth:** Bearer (Admin)

**Response 200:** `{ "success": true, "message": "Employee deleted successfully." }`

---

## Documents

### GET `/documents?page=1&limit=20&q=leave&category=Leave+Policy&status=ready`
List documents. Employees see `ready` only; admins see all statuses.

**Auth:** Bearer

**Query Params:** `page`, `limit`, `q`, `category`, `status` (admin only)

**Response 200:**
```json
{
  "success": true,
  "data": [{ "_id": "...", "title": "...", "category": "...", "status": "ready", "chunkCount": 24, ... }],
  "pagination": { "total": 12, "page": 1, "limit": 20, "pages": 1 }
}
```

> Employees do not receive `filePath` or `filename` fields.

---

### GET `/documents/:id`
Get a single document.

**Auth:** Bearer

**Response 200:** `{ "success": true, "data": { ... } }`

---

### POST `/documents/upload`
Upload a PDF document. Triggers background indexing.

**Auth:** Bearer (Admin)

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Required | Description |
|---|---|---|
| `file` | ✅ | PDF file, max 20 MB |
| `title` | ✅ | Display title (max 200 chars) |
| `category` | ✅ | One of the 10 HR categories |
| `description` | — | Optional summary (max 1000 chars) |

**Response 201:**
```json
{
  "success": true,
  "message": "Document uploaded. Indexing started.",
  "data": { "_id": "...", "status": "processing", ... }
}
```

**Errors:** `400` not PDF · `400` >20 MB · `422` validation failed

---

### PUT `/documents/:id`
Update document metadata. Admin only.

**Auth:** Bearer (Admin)

**Body:** `{ "title", "category", "description", "status" }` — all optional

> `status` can only be set to `ready` or `archived` via this endpoint.

**Response 200:** `{ "success": true, "message": "Document updated.", "data": { ... } }`

---

### DELETE `/documents/:id`
Delete a document, its physical file, and all associated chunks. Admin only.

**Auth:** Bearer (Admin)

**Response 200:** `{ "success": true, "message": "Document and all associated chunks deleted." }`

---

### GET `/documents/:id/download`
Stream the PDF file as an attachment.

**Auth:** Bearer

**Response:** `Content-Type: application/pdf` binary stream

---

### POST `/documents/:id/reindex`
Re-trigger the indexing pipeline for a failed document. Admin only.

**Auth:** Bearer (Admin)

**Response 200:** `{ "success": true, "message": "Re-indexing started." }`

**Errors:** `409` already processing · `404` not found

---

## Chat

### POST `/chat`
Ask an HR question. Returns an AI answer grounded in indexed documents.

**Auth:** Bearer (rate-limited: 30 req / min per IP)

**Body:**
```json
{ "question": "How many annual leave days do I get?" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "answer": "Employees receive 21 days of annual leave...",
    "sources": [
      { "document": "Leave Policy 2024", "category": "Leave Policy", "chunkIndex": 3, "score": 0.9124 }
    ],
    "confidence": "high",
    "conversationId": "64abc..."
  }
}
```

**Confidence values:** `high` (score ≥0.85) · `medium` (≥0.70) · `low` (<0.70)

**Errors:** `422` validation · `429` rate limit exceeded

---

### GET `/chat/history?page=1&limit=20&q=leave`
List conversation history. Employees see their own; admins see all.

**Auth:** Bearer

**Query Params:** `page`, `limit`, `q`

**Response 200:**
```json
{
  "success": true,
  "data": [{ "_id": "...", "question": "...", "answer": "...", "confidence": "high", ... }],
  "pagination": { "total": 34, "page": 1, "limit": 20, "pages": 2 }
}
```

---

### GET `/chat/history/:id`
Get a single conversation with its feedback.

**Auth:** Bearer (owner or admin)

**Response 200:**
```json
{ "success": true, "data": { ...conversation, "feedback": { "rating": "helpful", "comment": "..." } } }
```

---

### DELETE `/chat/history/:id`
Delete a conversation and its associated feedback.

**Auth:** Bearer (owner or admin)

**Response 200:** `{ "success": true, "message": "Conversation deleted." }`

---

### POST `/chat/feedback`
Submit or update feedback for an AI answer.

**Auth:** Bearer

**Body:**
```json
{
  "conversationId": "64abc...",
  "rating": "helpful",
  "comment": "Answered exactly what I needed."
}
```

> Calling this endpoint a second time on the same conversation **updates** the existing rating (upsert).

**Response 200:** `{ "success": true, "message": "Feedback saved.", "data": { ... } }`

**Errors:** `403` not owner · `404` conversation not found · `422` invalid rating

---

## Admin

### GET `/admin/analytics`
Retrieve platform-wide analytics. Admin only.

**Auth:** Bearer (Admin)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalConversations": 142,
      "totalUsers": 12,
      "totalDocuments": 8,
      "totalChunks": 384,
      "avgConfidenceScore": 0.82,
      "totalFeedback": 67,
      "helpfulPct": 84,
      "notHelpfulPct": 16,
      "cacheSize": 5
    },
    "confidenceDistribution": [
      { "confidence": "high", "count": 98 },
      { "confidence": "medium", "count": 31 },
      { "confidence": "low", "count": 13 }
    ],
    "topCategories": [{ "category": "Leave Policy", "count": 54 }, ...],
    "topDocuments": [{ "document": "Leave Policy 2024", "count": 54 }, ...],
    "dailyUsage": [{ "date": "2024-01-15", "count": 12 }, ...],
    "feedbackBreakdown": [
      { "label": "Helpful", "value": 56, "pct": 84 },
      { "label": "Not Helpful", "value": 11, "pct": 16 }
    ],
    "recentActivity": {
      "recentUploads": [...],
      "recentConversations": [...],
      "recentFeedback": [...]
    }
  }
}
```

---

## Common Error Responses

| Status | Meaning |
|---|---|
| `400` | Bad request (validation, wrong file type, invalid ID) |
| `401` | Unauthenticated (no token, expired token, invalid token) |
| `403` | Forbidden (insufficient role, not the owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, document already processing) |
| `422` | Validation failed (express-validator) |
| `429` | Too many requests (rate limiter) |
| `500` | Internal server error |

**Error shape:**
```json
{ "success": false, "message": "Human-readable message." }
```

**Validation error shape:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Must be a valid email address." }]
}
```
