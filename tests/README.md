## Unit tests (Issue #17)

### Test folder structure

```
tests/
└── back/
    ├── unit/
    │   ├── core/
    │   │   ├── test_password.py        # Password hashing & verification tests
    │   │   └── test_security.py        # JWT token creation & validation tests
    │   ├── routes/
    │   │   └── test_utils.py           # Route utility functions tests
    │   ├── logger/
    │   │   └── test_logger.py          # BackendLogger tests
    │   └── services/
    │       └── test_openweather.py     # OpenWeather service tests (TODO)
    └── integration/
        └── test_api_endpoints.py       # API integration tests (TODO)

src/front/src/__tests__/
├── unit/
│   ├── services/
│   │   ├── api.test.js                 # API fetch wrapper tests
│   │   ├── tokenManager.test.js        # Token management tests
│   │   ├── dashboard.test.js           # Dashboard service tests
│   │   ├── news.test.js                # News service tests
│   │   └── weather.test.js             # Weather service tests
│   └── components/
│       └── ...                         # Component tests (TODO)
└── integration/
    └── ...                             # Integration tests (TODO)
```

---

## Running tests

### Backend unit tests (pytest)

Run from repository root (`c:\Users\a\IPZ_Dashboard_ZUT`):

```bash
python -m pytest tests/back/unit
```

**Expected output:**
- `collected XX items`
- `XX passed`

### Frontend unit tests (jest)

Run from anywhere:

```bash
npm --prefix c:\Users\a\IPZ_Dashboard_ZUT\src\front test -- --watchAll=false --runInBand
```

**Expected output:**
- `Test Suites: X passed, X total`
- `Tests: XX passed, XX total`

---

## Coverage

### Backend coverage

```bash
python -m pytest tests/back/unit --cov=src/back --cov-report=term-missing
```

This will show a coverage table with percentages for each backend module.

### Frontend coverage

```bash
npm --prefix c:\Users\a\IPZ_Dashboard_ZUT\src\front test -- --watchAll=false --runInBand --coverage
```

This will show coverage summary for frontend files.

---

## Test summary

### Backend tests

| Module | Tests | Description |
|--------|-------|-------------|
| `test_password.py` | 13 | Password hashing with bcrypt, verification, edge cases |
| `test_security.py` | 11 | JWT token creation, validation, expiration |
| `test_utils.py` | 7 | Config object serialization |
| `test_logger.py` | 11 | Logger singleton, logging methods, configuration |
| **Total** | **42 tests** | ✅ All passing |

### Frontend tests

| Module | Tests | Description |
|--------|-------|-------------|
| `api.test.js` | 22 | API fetch wrapper, auth headers, error handling |
| `tokenManager.test.js` | 13 | LocalStorage token operations |
| `dashboard.test.js` | 9 | Dashboard CRUD operations, widgets |
| `news.test.js` | 6 | News fetching by category |
| `weather.test.js` | 8 | Weather config CRUD operations |
| **Total** | **50 tests** | ✅ All passing |

---

## Demo for lecturer (step-by-step)

### 1) Run all backend unit tests

```bash
python -m pytest tests/back/unit -v
```

### 2) Run all frontend unit tests

```bash
npm --prefix c:\Users\a\IPZ_Dashboard_ZUT\src\front test -- --watchAll=false --runInBand
```

### 3) Show coverage (optional)

```bash
# Backend coverage
python -m pytest tests/back/unit --cov=src/back --cov-report=term-missing

# Frontend coverage
npm --prefix c:\Users\a\IPZ_Dashboard_ZUT\src\front test -- --watchAll=false --runInBand --coverage
```

---

## Important notes

### pytest output percentages

When you see lines like `[ 66%]` or `[100%]` in pytest output, this is **test run progress**, not code coverage.

- `66%` = pytest has completed 2 out of 3 collected tests
- `100%` = pytest finished all collected tests

To check actual **code coverage**, run the coverage commands above.

### Test organization

- **Unit tests** (`tests/back/unit/`, `src/front/src/__tests__/unit/`): Test individual modules in isolation
- **Integration tests** (`tests/back/integration/`, `src/front/src/__tests__/integration/`): Test module interactions (TODO)


