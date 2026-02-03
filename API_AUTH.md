# API Authentication

## Overview

The Kanban API supports optional Bearer token authentication. When enabled, all API endpoints require a valid token in the Authorization header.

## Configuration

### Environment Variable

Set `API_TOKEN` in your `.env.local` or deployment environment:

```bash
API_TOKEN=b8fa90188ad4afcf5acdab9b172c3ff659413b88915cd5f8f06e6aeeeb6031ed
```

### Generating a Token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage

### With Authentication Enabled

Include the token in the `Authorization` header:

```bash
# GET all tasks
curl https://kanban-mu-gilt.vercel.app/api/tasks \
  -H "Authorization: Bearer b8fa90188ad4afcf5acdab9b172c3ff659413b88915cd5f8f06e6aeeeb6031ed"

# POST new task
curl -X POST https://kanban-mu-gilt.vercel.app/api/tasks \
  -H "Authorization: Bearer b8fa90188ad4afcf5acdab9b172c3ff659413b88915cd5f8f06e6aeeeb6031ed" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","priority":"high"}'
```

### JavaScript/TypeScript

```typescript
const API_URL = 'https://kanban-mu-gilt.vercel.app/api';
const API_TOKEN = process.env.API_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
};

// GET all tasks
const tasks = await fetch(`${API_URL}/tasks`, { headers }).then(r => r.json());

// POST new task
const newTask = await fetch(`${API_URL}/tasks`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'My Task',
    description: 'Task description',
    priority: 'high'
  })
}).then(r => r.json());
```

## Backward Compatibility

If `API_TOKEN` is **not set** in environment variables, the API remains **publicly accessible** without authentication (backward compatible with existing deployments).

## Protected Endpoints

All API endpoints require authentication when `API_TOKEN` is set:

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Epics
- `GET /api/epics` - List all epics
- `POST /api/epics` - Create epic
- `PATCH /api/epics/[id]` - Update epic
- `DELETE /api/epics/[id]` - Delete epic

### Comments
- `POST /api/tasks/[id]/comments` - Add comment
- `PATCH /api/comments/[id]` - Update comment
- `DELETE /api/comments/[id]` - Delete comment

## Not Protected

The following endpoints use **session-based authentication** (different system):
- `/api/auth/login` - Login with passcode
- `/api/auth/logout` - Logout
- `/api/auth/session` - Get session
- `/api/admin/passcodes/*` - Admin passcode management

## Error Responses

### 401 Unauthorized

Missing or invalid token:

```json
{
  "error": "Unauthorized - Invalid or missing API token"
}
```

### Example

```bash
# Without token (when API_TOKEN is set)
curl https://kanban-mu-gilt.vercel.app/api/tasks
# Response: 401 Unauthorized

# With correct token
curl https://kanban-mu-gilt.vercel.app/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
# Response: 200 OK with tasks
```

## Deployment

### Vercel

Add `API_TOKEN` to your environment variables:

1. Go to Project Settings → Environment Variables
2. Add `API_TOKEN` with your generated token
3. Redeploy

### Local Development

Create `.env.local`:

```bash
DATABASE_URL=your_database_url
API_TOKEN=b8fa90188ad4afcf5acdab9b172c3ff659413b88915cd5f8f06e6aeeeb6031ed
```

## Security Recommendations

1. **Use HTTPS** - Always use HTTPS in production (automatic on Vercel)
2. **Keep token secret** - Never commit `.env.local` to git
3. **Rotate tokens** - Change token if compromised
4. **Use environment variables** - Don't hardcode tokens in code

## For Clawdbot Integration

Store the token in your Clawdbot environment:

```bash
# In your shell profile or Clawdbot config
export KANBAN_API_TOKEN="b8fa90188ad4afcf5acdab9b172c3ff659413b88915cd5f8f06e6aeeeb6031ed"
```

Then use in API calls:

```bash
curl https://kanban-mu-gilt.vercel.app/api/tasks \
  -H "Authorization: Bearer $KANBAN_API_TOKEN"
```
