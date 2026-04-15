# Shougang Knowledge Portal Backend

This service is the BFF layer between the portal frontend and BiSheng.

## Scope

- Expose portal-facing APIs under `/api/v1`
- Translate BiSheng responses into portal schemas
- Hold portal-side static configuration for the first phase
- Proxy streaming chat requests to BiSheng

## Quick Start

1. Create a Python 3.11+ virtualenv.
2. Install dependencies:

```bash
pip install -e ".[dev]"
```

3. Run the app:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8010
```

4. Run tests:

```bash
pytest
```

## Environment Variables

- `PORTAL_APP_ENV`
- `PORTAL_APP_NAME`
- `PORTAL_BISHENG_BASE_URL`
- `PORTAL_BISHENG_TIMEOUT_SECONDS`
- `PORTAL_BISHENG_API_TOKEN`
