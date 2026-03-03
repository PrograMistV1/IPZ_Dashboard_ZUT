## Unit tests (Issue #17)

Implemented unit-test folders:

- `tests/back/unit/...` – backend unit tests (`pytest`)
- `src/front/src/__tests__/unit/...` – frontend unit tests (`jest`/`react-scripts`)

---

## Important: what does `66%` mean in pytest output?

When you see lines like:

- `[ 66% ]`
- `[100% ]`

this is **test run progress**, not code coverage.

- `66%` = pytest has completed 2 out of 3 collected tests.
- `100%` = pytest finished all collected tests.

To check **coverage** (how much code is covered by tests), run dedicated coverage commands below.

---

## Demo for lecturer (step-by-step)

### 1) Backend unit tests (pass/fail)

Run from repository root (`c:\Users\a\IPZ_Dashboard_ZUT`):

```bash
python -m pytest tests/back/unit
```

Expected end of output:

- `collected 3 items`
- `3 passed`

### 2) Frontend unit tests (pass/fail)

Run from anywhere:

```bash
npm --prefix c:\Users\a\IPZ_Dashboard_ZUT\src\front test -- --watchAll=false --runInBand
```

Expected end of output:

- `Test Suites: 2 passed, 2 total`
- `Tests: 5 passed, 5 total`

---

## Coverage demo (optional, stronger presentation)

### Backend coverage

```bash
python -m pytest tests/back/unit --cov=src/back --cov-report=term-missing
```

You will get a coverage table with `%` for backend modules.

### Frontend coverage

```bash
npm --prefix c:\Users\a\IPZ_Dashboard_ZUT\src\front test -- --watchAll=false --runInBand --coverage
```

You will get a coverage summary for frontend files.


