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

## BiSheng Auth

The portal backend currently does not log in to BiSheng with username/password.

For the current stage, configure `PORTAL_BISHENG_API_TOKEN` with a valid BiSheng
`access_token_cookie` value from an administrator session. The client will send
it as both:

- `Authorization: Bearer <token>`
- Cookie `access_token_cookie=<token>`

This keeps BiSheng unchanged while allowing the portal backend to call the
existing knowledge and workstation APIs.
