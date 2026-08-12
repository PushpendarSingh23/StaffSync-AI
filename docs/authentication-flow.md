# Authentication & Authorisation Flow

## Registration

```mermaid
flowchart TD
    A([POST /auth/register]) --> V[express-validator: fullName, email, password, role]
    V --> E{Email exists?}
    E -- Yes --> C409([409 Conflict])
    E -- No --> RG{role = admin?}
    RG -- No employee --> CR[User.create password bcrypt 12 rounds]
    RG -- Yes --> AE{Admin already exists?}
    AE -- No first setup --> CR
    AE -- Yes --> AT{Valid admin JWT in header?}
    AT -- No --> C403([403 Forbidden])
    AT -- Yes --> CR
    CR --> TK[jwt.sign id, 7d]
    TK --> RS([201: token + user without password])
```

## Login

```mermaid
flowchart TD
    A([POST /auth/login]) --> V[Validate email + password fields]
    V --> FU[User.findOne email .select +password]
    FU --> EU{User found?}
    EU -- No --> C401([401 Generic: invalid email or password])
    EU -- Yes --> BC[bcrypt.compare plainText, hash]
    BC --> PM{Match?}
    PM -- No --> C401
    PM -- Yes --> TK[jwt.sign id, 7d expiry]
    TK --> RS([200: token + user])
```

## Request Authentication

```mermaid
flowchart TD
    REQ([Incoming request]) --> AH{Authorization header present?}
    AH -- No --> U401([401: No token])
    AH -- Yes --> JV[jwt.verify token, JWT_SECRET]
    JV --> JE{JWT valid?}
    JE -- Expired --> EV([401: TOKEN_EXPIRED code])
    JE -- Invalid --> IV([401: Invalid token])
    JE -- Valid --> UF[User.findById decoded.id]
    UF --> UE{User exists?}
    UE -- No --> NE([401: User no longer exists])
    UE -- Yes --> RA[req.user = user]
    RA --> NEXT([next middleware])
```

## Role Authorisation

```mermaid
flowchart TD
    REQ([Request with req.user]) --> RC{requiredRole set?}
    RC -- No --> PASS([Pass through])
    RC -- Yes --> CM{user.role in allowed roles?}
    CM -- Yes --> PASS
    CM -- No --> C403([403: Access denied])
```

## Client Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> LoggedOut
    LoggedOut --> LoggedIn: POST /auth/login → store token
    LoggedIn --> LoggedIn: apiFetch auto-attaches Bearer header
    LoggedIn --> LoggedOut: Token expires → 401 TOKEN_EXPIRED\nauth:expired event → AuthContext.logout()
    LoggedIn --> LoggedOut: User clicks Sign out
    LoggedOut --> LoggedIn: Session restore on page load\nGET /auth/me with stored token
```

## Security Measures

| Concern | Mitigation |
|---|---|
| Password storage | bcrypt with cost factor 12 |
| Password exposure | `select: false` + `toJSON` transform strip `password` |
| Token forgery | RS256-equivalent HMAC via `JWT_SECRET` |
| Token replay after logout | Short-lived tokens (7d); revocation via future blocklist |
| Brute force login | `authLimiter`: 10 requests / 15 min per IP |
| Admin self-registration | Blocked if any admin exists — requires existing admin JWT |
| CSRF | Not applicable — token-based auth, no cookies |
| XSS → token theft | `localStorage` — acceptable for this architecture; migrate to `httpOnly` cookies for hardened production |
| Injection | All user input validated + sanitised via express-validator |
