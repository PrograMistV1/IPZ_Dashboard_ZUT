# IPZ_Dashboard_ZUT

[![Python](https://img.shields.io/badge/python-3.12-green.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/node-18-red.svg)](https://nodejs.org/)

## API Documentation

The backend is implemented using **FastAPI**, which automatically generates an
OpenAPI (Swagger) specification and provides a web-based UI for interacting
with the services.

- **Swagger UI:** `http://127.0.0.1:8000/docs`  – browse endpoints, send
  requests, and authenticate without needing the frontend.
- **Raw spec:** `http://127.0.0.1:8000/openapi.json` – useful for client
  generation or inspection.

Detailed usage and authentication instructions are available in the
[swagger_integration.md](docs/swagger_integration.md) file.

