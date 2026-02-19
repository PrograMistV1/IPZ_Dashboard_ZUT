# Swagger / OpenAPI Integration

> This document explains how to access the backend API directly using the
> automatically-generated Swagger (OpenAPI) UI.  It replaces the original
> `flask-swagger` task because the project uses **FastAPI**, which provides
> a full OpenAPI implementation out of the box.

## 📌 Accessing the Swagger UI

- Start the backend service with `python -m src.back.main` (or via the provided
  startup script).
- Open your browser and navigate to: `http://127.0.0.1:8000/docs`
- You will see the Swagger UI showing all endpoints grouped by tags
  (Authentication, Dashboard, Rates, etc.).
- The raw OpenAPI specification is available at
  `http://127.0.0.1:8000/openapi.json` if you need to generate a client.

> ⚠️ If the frontend build directory (`src/front/build`) exists the same
> application also serves the React app at `/`, but the API docs remain at
> `/docs` and `/redoc`.

## 🔐 Authenticating through Swagger

Several endpoints require a bearer token obtained by logging in.  FastAPI has
been configured with an HTTPBearer security scheme, so the Swagger UI displays
an **Authorize** button in the top-right corner.

1. Expand the `Authentication` section.
2. Call the `/auth/login` endpoint with valid `username` and `password`.
   The response will include an `access_token`.
3. Click **Authorize** in the Swagger UI and paste the token in the input field
   (prefix with `Bearer ` if not already).  Example:
   ````
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ````
4. Once authorized, you may call any other `protected` endpoint (those that
   depend on `get_current_user`) directly from the UI.  The token is included
   as an `Authorization` header automatically.

## ✅ Example workflow

1. Register a new user using `POST /auth/register`.
2. Log in with the new credentials (`POST /auth/login`).
3. Use `/auth/me` to retrieve account information.
4. Hit `/dashboard/…`, `/rates/…`, or any other routes to fetch data.
5. Inspect request/response bodies and status codes directly in the
   documentation interface.

## 🧩 Generating clients or scripts

Because the OpenAPI schema is standard, you can generate client libraries with
tools such as `swagger-codegen`, `openapi-generator` or use `curl`/`httpie`.

Example with `curl`:

```bash
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}' | jq -r '.access_token')

curl "http://127.0.0.1:8000/dashboard" \
  -H "Authorization: Bearer $TOKEN"
```

## 📎 Notes for developers

- No changes to existing route handlers were required; FastAPI automatically
  reflects parameter types, request bodies, and response models in the docs.
- New endpoints should specify request/response models (using Pydantic) and
  include docstrings if additional description is needed.
- Tags can be assigned when routers are included in `src/back/main.py` to
  control how operations are grouped in the UI.

---

This article satisfies the acceptance criteria for issue **#81** by allowing
backend interaction without the frontend and documenting the process.