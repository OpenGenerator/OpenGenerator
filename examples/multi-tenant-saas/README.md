# Multi-Tenant SaaS Example

A complete multi-tenant SaaS API example with organization-based data isolation.

## Features

- Row-level security for multi-tenancy
- JWT authentication with refresh tokens
- Organization-based data isolation
- Role-based access control (RBAC)
- Project management with tasks and comments
- Soft delete support
- Audit fields (createdBy, updatedBy)

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Run migrations
pnpm db:migrate

# Generate API code
pnpm generate

# Start development server
pnpm dev
```

## Multi-Tenancy Strategy

This example uses **row-level security** where:
- Each row has an `organizationId` field
- All queries are automatically scoped to the current tenant
- The tenant is identified via the `X-Organization-ID` header or JWT

## Data Model

```
Organization (Tenant)
├── Users
├── Projects
│   ├── ProjectMembers
│   └── Tasks
│       ├── Comments
│       └── Labels
├── Invites
└── Settings
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new organization
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Organizations
- `GET /api/v1/organizations/:id` - Get organization
- `PUT /api/v1/organizations/:id` - Update organization
- `POST /api/v1/organizations/:id/invite` - Invite user

### Projects (Tenant-scoped)
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Tasks
- `GET /api/v1/projects/:projectId/tasks` - List tasks
- `POST /api/v1/projects/:projectId/tasks` - Create task
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| OWNER | Full access, billing, delete org |
| ADMIN | Manage users, projects, settings |
| MEMBER | Create/edit own content |
| VIEWER | Read-only access |

## Learn More

- [Multi-Tenancy Patterns](https://opengenerator.dev/guides/multi-tenancy)
- [Authentication Guide](https://opengenerator.dev/guides/authentication)
- [RBAC Guide](https://opengenerator.dev/guides/rbac)
