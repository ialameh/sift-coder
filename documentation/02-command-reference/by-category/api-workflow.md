# API Workflow Commands

**API development and documentation**

---

## Overview

The API workflow contains 5 commands for designing, documenting, and validating APIs.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/api document` | Generate OpenAPI spec | ⭐⭐ Intermediate | 5-15 min |
| `/api validate` | Validate against spec | ⭐ Beginner | 2-5 min |
| `/api breaking` | Detect breaking changes | ⭐⭐ Intermediate | 5-10 min |
| `/api mock` | Generate mock server | ⭐⭐ Intermediate | 5-10 min |
| `/api client` | Generate client SDK | ⭐⭐⭐ Advanced | 10-20 min |

---

## /api document

Generate OpenAPI/Swagger specification from code.

### Syntax
```bash
/siftcoder:api document
```

### Output

Generates `openapi.yaml`:
```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Successful response
```

---

## /api validate

Validate implementation against OpenAPI specification.

### Syntax
```bash
/siftcoder:api validate openapi.yaml
```

### Output

Checks:
- All endpoints implemented
- Request/response schemas match
- Authentication requirements met

---

## /api breaking

Detect breaking changes between API versions.

### Syntax
```bash
/siftcoder:api breaking openapi-v1.yaml openapi-v2.yaml
```

### Output

Reports:
- Removed endpoints
- Changed parameters
- Modified response schemas
- Breaking authentication changes

---

## /api mock

Generate a mock server from API specification.

### Syntax
```bash
/siftcoder:api mock openapi.yaml
```

### Output

Creates mock server with:
- All endpoints from spec
- Example responses
- CORS enabled
- Ready for frontend development

---

## /api client

Generate client SDK in various languages.

### Syntax
```bash
/siftcoder:api client --language typescript
```

### Supported Languages

- TypeScript
- Python
- JavaScript
- Go
- Java

---

## Workflow Examples

### Create API from Scratch

```bash
# 1. Design and implement API
[scaffold API endpoints]

# 2. Generate OpenAPI spec
/siftcoder:api document

# 3. Validate
/siftcoder:api validate

# 4. Generate mock server for frontend
/siftcerer:api mock

# 5. Generate client SDK
/siftcoder:api client --language typescript
```

---

## See Also

- [BUILD Workflow](build-workflow.md) - API development
- [DOCUMENT Workflow](document-workflow.md) - API documentation
