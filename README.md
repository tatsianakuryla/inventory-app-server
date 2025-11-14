# Inventory Management System - Backend API

A comprehensive REST API for managing personal collections with customizable fields, granular access control, and social authentication support.

## 🌐 Live Demo

**Production API:** https://site--inventory-app-server--sm9fnltkyqvh.code.run/

Test the connection:

```bash
curl https://site--inventory-app-server--sm9fnltkyqvh.code.run/
# Should return: {"status":"ok"}
```

## 📋 Table of Contents

- [Overview](#-overview)
- [Technology Stack](#-technology-stack)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Security](#-security)
- [Development Guide](#-development-guide)

---

## 🎯 Overview

This backend system provides a robust foundation for building collection management applications. Users can create custom collections (inventories) with flexible field configurations, share them with others, and organize items with categories and tags.

**Use Cases:**

- Personal libraries (books, movies, games)
- Asset management
- Product catalogs
- Research databases
- Any structured collection organization

### Recent Improvements

✨ **Latest Features:**

- **Custom ID Service** - Robust auto-generation of item IDs with configurable formats
- **Full-Text Search** - PostgreSQL-powered search with ranking across all item fields
- **Bulk Operations** - Delete multiple items/inventories with conflict handling
- **Admin Write Access** - Admins can view and edit all collections
- **Bulk Visibility Control** - Update public/private status for multiple collections
- **Like System** - Users can like items with aggregated counts
- **Enhanced Validation** - Zod schemas with proper type coercion and error messages

---

## 🛠 Technology Stack

### Core Technologies

- **Node.js** (18+) - JavaScript runtime
- **Express** - Fast, minimalist web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma ORM** - Next-generation database toolkit
- **PostgreSQL** (14+) - Robust relational database

### Key Libraries

- **Zod** - Schema validation with TypeScript integration
- **JWT (jsonwebtoken)** - Stateless authentication
- **bcryptjs** - Secure password hashing
- **Google Auth Library** - OAuth2 for Google Sign-In
- **Helmet** - Security middleware for Express
- **CORS** - Cross-Origin Resource Sharing

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## ✨ Key Features

### 👥 User Management

- **Multiple Authentication Methods**
  - Email/password registration
  - Google OAuth2
  - Facebook OAuth2
- **Role-Based Access Control (RBAC)**
  - USER role - standard access
  - ADMIN role - elevated privileges
- **User Status Management**
  - ACTIVE - full access
  - BLOCKED - restricted access
- **Profile Customization**
  - Language preferences (EN, RU)
  - Theme selection (LIGHT, DARK)
- **Optimistic Locking** - Version-based conflict prevention

### 📦 Collection (Inventory) Management

- **CRUD Operations** with validation
- **Visibility Control**
  - Public collections - accessible to everyone
  - Private collections - owner and invited users only
- **Granular Access Control**
  - OWNER - full control
  - EDITOR - can modify collection and items
  - VIEWER - read-only access
- **15 Customizable Fields**
  - 3x Text fields (short input)
  - 3x Long text fields (textarea)
  - 3x Numeric fields
  - 3x Link/URL fields
  - 3x Boolean fields (checkboxes)
  - Each field configurable: name, description, visibility, table display
- **Custom Item ID Format**
  - Define format with literals, sequences, and date elements
  - Configurable prefix, counter, and date patterns
  - Auto-increment sequences with conflict retry
  - Example formats: `BOOK-0001`, `ITEM-2024-0001`, `PRD-A-001`
- **Search & Filtering**
  - Full-text search across name and description
  - Pagination with configurable page size
  - Sorting by multiple fields

### 📝 Item Management

- **Dynamic Fields** based on collection configuration
- **Automatic ID Generation** using custom format with retry logic
- **Like System** - users can like/unlike items
- **Full-Text Search**
  - PostgreSQL `tsvector` for fast search
  - Search across all text fields (text1-3, long1-3)
  - Ranked results by relevance
  - Supports complex queries
- **Bulk Operations**
  - Mass deletion with version checking
  - Conflict resolution and detailed reporting
- **Version Control** - prevents concurrent update conflicts (optimistic locking)

### 🏷️ Organization

- **Categories**
  - Reusable categories across collections
  - Admin-managed
  - Usage statistics
- **Tags**
  - Many-to-many relationship
  - Popular tags tracking
  - Flexible tagging system

### 💬 Collaboration

- **Discussion System**
  - Comments on collections
  - Markdown support
  - Author information
  - Chronological ordering

### 👨‍💼 Administration

- **User Management Dashboard**
  - View all users with filtering and search
  - Block/unblock users (bulk operations)
  - Promote/demote roles (bulk operations)
  - Delete users (bulk operations)
  - Protected super admins (cannot be blocked/demoted/deleted)
- **Content Management**
  - Full access to all collections (read/write)
  - View collections with write access via `/api/inventory/my/write-access`
  - Bulk update collection visibility
  - Category administration (create/update/delete)
  - Tag creation and management

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18.x or higher
- **PostgreSQL** v14.x or higher
- **npm** or **yarn** package manager

### Installation Steps

#### 1. Clone and Install Dependencies

```bash
cd server
npm install
```

#### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db?schema=public"

# JWT Configuration
JWT_SECRET="your-very-secure-secret-key-min-32-characters"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS - Comma-separated list of allowed origins
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# Facebook OAuth (optional)
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Super Administrators - Comma-separated emails
# These users cannot be blocked, demoted, or deleted
SUPERADMINS="admin@example.com,superadmin@example.com"
```

**Important Notes:**

- Replace database credentials with your PostgreSQL setup
- Generate a strong JWT_SECRET (recommended: 32+ random characters)
- Configure OAuth credentials if using social login
- Add your admin email to SUPERADMINS

#### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed with sample data
npm run prisma:seed
```

#### 4. Start the Server

```bash
# Development mode with hot reload
  npm run dev

# Production mode
  npm start
```

The API will be available at: `http://localhost:3000`

Test the connection:

```bash
curl http://localhost:3000
# Should return: {"status":"ok"}
```

---

## 🚢 Deployment

### Production Environment

The API is deployed at: **https://site--inventory-app-server--sm9fnltkyqvh.code.run/**

### Environment Variables for Production

Ensure the following environment variables are configured in your deployment platform:

```env
# Database (Production PostgreSQL)
DATABASE_URL="postgresql://..."

# JWT Configuration
JWT_SECRET="production-secret-min-32-characters"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="production"

# CORS - Add production client URLs
ALLOWED_ORIGINS="https://your-client-domain.com,https://your-app.com"

# OAuth Credentials (Production)
GOOGLE_CLIENT_ID="..."
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."

# Super Admins
SUPERADMINS="admin@example.com"
```

### Deployment Checklist

Before deploying to production:

- ✅ Set `NODE_ENV=production`
- ✅ Use strong, unique `JWT_SECRET` (32+ characters)
- ✅ Configure production database with connection pooling
- ✅ Run database migrations: `npm run prisma:migrate`
- ✅ Update `ALLOWED_ORIGINS` with actual client domains
- ✅ Set up HTTPS (handled by deployment platform)
- ✅ Configure OAuth credentials for production domains
- ✅ Add super admin email addresses
- ✅ Enable database backups
- ✅ Set up monitoring and logging

### Build and Start

```bash
# Generate Prisma Client
npm run prisma:generate

# Start production server
npm start
```

---

## 📁 Project Structure

```
server/
├── app.ts                          # Application entry point
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.js                # ESLint rules
├── .prettierrc                     # Prettier formatting rules
├── .env                            # Environment variables (create this)
└── src/
    ├── categories/                 # Category management module
    │   ├── controllers/
    │   │   └── categories.controller.ts
    │   ├── router/
    │   │   └── categories.router.ts
    │   └── shared/
    │       └── types/
    │           └── tags.categories.discussions.inventory.items.schemas.ts      # Zod validation schemas
    │
    ├── discussions/                # Discussion/comments module
    │   ├── controllers/
    │   ├── router/
    │   └── shared/
    │
    ├── inventory/                  # Collections management
    │   ├── controllers/
    │   │   └── inventory.controller.ts
    │   ├── customIdService/        # Custom ID generation service
    │   ├── router/
    │   ├── shared/
    │   │   ├── constants/
    │   │   ├── middlewares/        # Inventory-specific middleware
    │   │   ├── types/
    │   │   └── typeguards/
    │
    ├── items/                      # Items management
    │   ├── controllers/
    │   ├── customIdService/
    │   ├── router/
    │   └── shared/
    │
    ├── tags/                       # Tagging system
    │   ├── controllers/
    │   ├── router/
    │   └── shared/
    │
    ├── users/                      # User management
    │   ├── controllers/
    │   │   ├── admin/              # Admin operations
    │   │   ├── social/             # OAuth controllers
    │   │   ├── token/              # JWT token management
    │   │   ├── user/               # User operations
    │   │   └── types/
    │   ├── router/
    │   │   ├── users.router.ts
    │   │   └── admin.router.ts
    │   ├── security/               # Password hashing
    │   └── shared/
    │       ├── constants/
    │       ├── helpers/
    │       └── types/
    │
    └── shared/                     # Shared resources
        ├── constants/              # Global constants
        ├── db/                     # Prisma client
        │   └── db.ts
        ├── googleClient/           # Google OAuth client
        ├── middlewares/            # Express middleware
        │   ├── requireAdmin.ts
        │   ├── requireAuthAndNotBlocked.ts
        │   └── validator.ts        # Zod validation middleware
        ├── prisma/                 # Database schema
        │   ├── schema.prisma
        │   ├── migrations/
        │   └── seed.ts
        ├── types/                  # Shared TypeScript types
        └── typeguards/             # Type guard functions
```

### Architecture Principles

1. **Modular Design** - Each feature is a self-contained module
2. **Layered Architecture**:
   - **Router** - Route definitions
   - **Middleware** - Validation, authentication, authorization
   - **Controller** - Business logic
   - **Service** - Reusable business logic
   - **Prisma** - Database access
3. **Type Safety** - Zod schemas + TypeScript for runtime & compile-time safety
4. **Separation of Concerns** - Each layer has a single responsibility

---

## 🌐 API Documentation

### Base URLs

**Local Development:**

```
http://localhost:3000/api
```

**Production:**

```
https://site--inventory-app-server--sm9fnltkyqvh.code.run/api
```

### Authentication Header

Most endpoints require JWT authentication:

```http
Authorization: Bearer <jwt-token>
```

### Quick Reference

#### 🔐 Authentication Endpoints

| Method | Endpoint                    | Description               | Auth Required |
| ------ | --------------------------- | ------------------------- | ------------- |
| POST   | `/api/users/register`       | Create new account        | ❌            |
| POST   | `/api/users/login`          | Login with email/password | ❌            |
| POST   | `/api/users/google/login`   | Login with Google         | ❌            |
| POST   | `/api/users/facebook/login` | Login with Facebook       | ❌            |
| GET    | `/api/users/me`             | Get current user profile  | ✅            |
| PATCH  | `/api/users/me`             | Update profile            | ✅            |
| GET    | `/api/users/autocomplete`   | Search users              | ✅            |

#### 📦 Collection Endpoints

| Method | Endpoint                         | Description                | Auth Required    |
| ------ | -------------------------------- | -------------------------- | ---------------- |
| POST   | `/api/inventory`                 | Create collection          | ✅               |
| GET    | `/api/inventory`                 | List all collections       | ❌ (public only) |
| GET    | `/api/inventory/my`              | Get my owned collections   | ✅               |
| GET    | `/api/inventory/my/write-access` | Get collections I can edit | ✅               |
| GET    | `/api/inventory/:id`             | Get collection details     | ❌ (if public)   |
| PATCH  | `/api/inventory/:id`             | Update collection          | ✅ (owner/admin) |
| DELETE | `/api/inventory`                 | Delete collections (bulk)  | ✅ (owner/admin) |
| PATCH  | `/api/inventory/visibility`      | Update visibility (bulk)   | ✅ (owner/admin) |
| GET    | `/api/inventory/:id/access`      | Get access list            | ✅ (owner/admin) |
| PUT    | `/api/inventory/:id/access`      | Update access              | ✅ (owner/admin) |
| DELETE | `/api/inventory/:id/access`      | Revoke access              | ✅ (owner/admin) |
| PUT    | `/api/inventory/:id/fields`      | Configure fields           | ✅ (owner/admin) |
| PUT    | `/api/inventory/:id/id-format`   | Set custom ID format       | ✅ (owner/admin) |
| GET    | `/api/inventory/:id/statistics`  | Get collection statistics  | ❌ (if public)   |

#### 📝 Item Endpoints

| Method | Endpoint                               | Description         | Auth Required             |
| ------ | -------------------------------------- | ------------------- | ------------------------- |
| GET    | `/api/items/:inventoryId`              | List items          | ❌ (if collection public) |
| GET    | `/api/items/:inventoryId/:itemId`      | Get item            | ❌ (if collection public) |
| POST   | `/api/items/:inventoryId`              | Create item         | ✅ (editor+)              |
| PATCH  | `/api/items/:inventoryId/:itemId`      | Update item         | ✅ (editor+)              |
| DELETE | `/api/items/:inventoryId`              | Delete items (bulk) | ✅ (editor+)              |
| POST   | `/api/items/:inventoryId/:itemId/like` | Like item           | ✅                        |
| DELETE | `/api/items/:inventoryId/:itemId/like` | Unlike item         | ✅                        |

#### 🏷️ Category & Tag Endpoints

| Method | Endpoint                 | Description            | Auth Required |
| ------ | ------------------------ | ---------------------- | ------------- |
| GET    | `/api/categories`        | List categories        | ❌            |
| GET    | `/api/categories/stats`  | Category statistics    | ❌            |
| POST   | `/api/categories`        | Create category        | ✅ (admin)    |
| PATCH  | `/api/categories/:id`    | Update category        | ✅ (admin)    |
| DELETE | `/api/categories/:id`    | Delete category        | ✅ (admin)    |
| GET    | `/api/tags`              | List tags              | ❌            |
| GET    | `/api/tags/popular`      | Popular tags           | ❌            |
| POST   | `/api/tags`              | Create tag             | ✅ (admin)    |
| PUT    | `/api/tags/:inventoryId` | Update collection tags | ✅ (editor+)  |

#### 💬 Discussion Endpoints

| Method | Endpoint                         | Description      | Auth Required             |
| ------ | -------------------------------- | ---------------- | ------------------------- |
| GET    | `/api/discussions/:inventoryId`  | List discussions | ❌ (if collection public) |
| POST   | `/api/discussions/:inventoryId`  | Create comment   | ✅                        |
| DELETE | `/api/discussions/:discussionId` | Delete comment   | ✅ (author/admin)         |

#### 👨‍💼 Admin Endpoints

| Method | Endpoint                   | Description      | Auth Required |
| ------ | -------------------------- | ---------------- | ------------- |
| GET    | `/api/admin`               | List all users   | ✅ (admin)    |
| POST   | `/api/admin/users/block`   | Block users      | ✅ (admin)    |
| POST   | `/api/admin/users/unblock` | Unblock users    | ✅ (admin)    |
| POST   | `/api/admin/users/promote` | Promote to admin | ✅ (admin)    |
| POST   | `/api/admin/users/demote`  | Demote to user   | ✅ (admin)    |
| DELETE | `/api/admin/users`         | Delete users     | ✅ (admin)    |

#### 🏠 Home Page Endpoints

| Method | Endpoint              | Description               | Auth Required |
| ------ | --------------------- | ------------------------- | ------------- |
| GET    | `/api/home/latest`    | Latest N inventories      | ❌            |
| GET    | `/api/home/popular`   | Top 5 popular inventories | ❌            |
| GET    | `/api/home/tag-cloud` | Tag cloud with weights    | ❌            |

#### 📊 Statistics Endpoint

| Method | Endpoint                        | Description          | Auth Required  |
| ------ | ------------------------------- | -------------------- | -------------- |
| GET    | `/api/inventory/:id/statistics` | Inventory statistics | ❌ (if public) |

---

## 📦 Response Object Types

### User Object

```text
{
  id: string;              // Unique user ID (CUID)
  email: string;           // User email
  name: string;            // Display name
  imageUrl?: string;       // Profile picture URL (optional)
  role: "USER" | "ADMIN";  // User role
  status: "ACTIVE" | "BLOCKED";  // Account status
  language: "EN" | "RU";   // Preferred language
  theme: "LIGHT" | "DARK"; // UI theme preference
  version: number;         // For optimistic locking
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  token?: string;          // JWT token (only on login/register)
}
```

---

### Collection (Inventory) Object

```text
{
  id: string;              // Unique collection ID (CUID)
  name: string;            // Collection name (1-200 chars)
  description?: string;    // Description (optional, max 2000 chars)
  imageUrl?: string;       // Cover image URL (optional)
  categoryId?: number;     // Category ID (optional)
  isPublic: boolean;       // Visibility flag
  ownerId: string;         // Owner user ID
  version: number;         // For optimistic locking
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp

  // Extended fields (when fetching single collection)
  fields?: InventoryFieldsObject;
  InventoryIdFormat?: IdFormatObject;
  category?: CategoryObject;
  tags?: TagObject[];
}
```

---

### InventoryFields Object

```text
{
  inventoryId: string;
  version: number;

  // Text fields (3x)
  text1State: "HIDDEN" | "SHOWN";
  text1Name?: string;      // Display name (max 100 chars)
  text1Desc?: string;      // Description (max 500 chars)
  text1ShowInTable: boolean;
  // text2, text3 - same structure

  // Long text fields (3x)
  long1State: "HIDDEN" | "SHOWN";
  long1Name?: string;
  long1Desc?: string;
  long1ShowInTable: boolean;
  // long2, long3 - same structure

  // Numeric fields (3x)
  num1State: "HIDDEN" | "SHOWN";
  num1Name?: string;
  num1Desc?: string;
  num1ShowInTable: boolean;
  // num2, num3 - same structure

  // Link/URL fields (3x)
  link1State: "HIDDEN" | "SHOWN";
  link1Name?: string;
  link1Desc?: string;
  link1ShowInTable: boolean;
  // link2, link3 - same structure

  // Boolean fields (3x)
  bool1State: "HIDDEN" | "SHOWN";
  bool1Name?: string;
  bool1Desc?: string;
  bool1ShowInTable: boolean;
  // bool2, bool3 - same structure

  displayOrder?: string[]; // Optional field ordering
}
```

---

### Item Object

```text
{
  id: string;              // Unique item ID (CUID)
  inventoryId: string;     // Parent collection ID
  customId: string;        // User-friendly ID (auto-generated)
  createdById: string;     // Creator user ID
  version: number;         // For optimistic locking
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp

  // Dynamic fields (based on collection configuration)
  text1?: string;
  text2?: string;
  text3?: string;
  long1?: string;          // Long text
  long2?: string;
  long3?: string;
  num1?: number;           // Numeric value
  num2?: number;
  num3?: number;
  link1?: string;          // URL
  link2?: string;
  link3?: string;
  bool1?: boolean;
  bool2?: boolean;
  bool3?: boolean;

  // Extended fields (when fetching items list)
  likesCount?: number;           // Total likes count
  isLikedByCurrentUser?: boolean; // Current user's like status
}
```

---

### Category Object

```text
{
  id: number;              // Auto-increment ID
  name: string;            // Category name (unique, 1-100 chars)
  description?: string;    // Description (optional, max 500 chars)
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp

  // Extended field (in stats endpoint)
  _count?: {
    Inventory: number;     // Number of collections in this category
  };
}
```

---

### Tag Object

```text
{
  id: number;              // Auto-increment ID
  name: string;            // Tag name (unique, 1-50 chars)
  createdAt: string;       // ISO 8601 timestamp

  // Extended field (in popular tags endpoint)
  _count?: {
    inventories: number;   // Number of collections with this tag
  };
}
```

---

### DiscussionPost Object

```text
{
  id: string;              // Unique comment ID (CUID)
  inventoryId: string;     // Collection ID
  authorId: string;        // Author user ID
  content: string;         // Comment text (1-2000 chars)
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp

  // Extended field
  author: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
  };
}
```

---

### InventoryAccess Object

```text
{
  userId: string;
  inventoryId: string;
  inventoryRole: "OWNER" | "EDITOR" | "VIEWER";

  // Extended field
  user: {
    id: string;
    name: string;
    email: string;
  };
}
```

---

### Paginated Response (Generic)

Used for collections, items, and users lists:

```text
{
  items: T[];              // Array of objects
  total: number;           // Total count in database
  page: number;            // Current page number
  perPage: number;         // Items per page
  hasMore: boolean;        // True if more pages available
}
```

**Example:**

```text
{
  "items": [/* ... */],
  "total": 42,
  "page": 1,
  "perPage": 20,
  "hasMore": true
}
```

---

### Bulk Operation Response

Used for bulk delete and update operations:

```text
{
  deleted: number;              // Number of successfully deleted items
  deletedIds: string[];         // IDs of deleted items
  conflicts: number;            // Version conflicts count
  conflictIds: string[];        // IDs with version conflicts
  skipped: number;              // Skipped items count
  skippedIds: string[];         // IDs of skipped items
}
```

---

### Access Management Response

```text
{
  processed: number;            // Total processed
  created: number;              // Newly created access entries
  createdUserIds: string[];     // User IDs with new access
  updated: number;              // Updated access entries
  updatedUserIds: string[];     // User IDs with updated access
  unchanged: number;            // Unchanged entries
  unchangedUserIds: string[];
  skipped: number;              // Skipped entries
  skippedInvalidOwnerUserIds: string[];  // Can't modify owner
}
```

---

### Error Response

All errors return consistent format:

```text
{
  error: string;           // Human-readable error message
  details?: object;        // Additional error details (optional)
}
```

**Common HTTP Status Codes:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User blocked or insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Version mismatch or duplicate entry
- `500 Internal Server Error` - Server error

**Example Error Response:**

```json
{
  "error": "Version conflict - resource was modified by another user"
}
```

---

### Example API Requests

**Required fields:**

- `version` - For optimistic locking
- `patch` - Object with field configurations

**Available fields (3 of each type):**

- `text1`, `text2`, `text3` - Short text
- `long1`, `long2`, `long3` - Long text
- `num1`, `num2`, `num3` - Numbers
- `link1`, `link2`, `link3` - URLs
- `bool1`, `bool2`, `bool3` - Booleans

**For each field:**

- `{field}State` - "HIDDEN" or "SHOWN"
- `{field}Name` - Display name (max 100 chars)
- `{field}Desc` - Description (max 500 chars)
- `{field}ShowInTable` - Show in item list

**Response 200 OK:**

```json
{
  "inventoryId": "clyyy456...",
  "version": 2
}
```

---

#### Create Item

```http
POST http://localhost:3000/api/items/clyyy456...
Authorization: Bearer <token>
Content-Type: application/json

{
  "text1": "The Great Gatsby",
  "text2": "F. Scott Fitzgerald",
  "num1": 1925,
  "bool1": true
}
```

**Response 201 Created:**

```json
{
  "id": "clzzz789...",
  "inventoryId": "clyyy456...",
  "customId": "BOOK-0001",
  "createdById": "clxxx123...",
  "version": 1,
  "text1": "The Great Gatsby",
  "text2": "F. Scott Fitzgerald",
  "num1": 1925,
  "bool1": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### List Items

```http
GET http://localhost:3000/api/items/clyyy456...?search=gatsby&page=1&perPage=20
Authorization: Bearer <token> (optional, required for private)
```

**Query parameters:**

- `search` - Search across all text and numeric fields
- `page`, `perPage`, `sortBy`, `order` - Same as collections

**Response 200 OK:**

```json
{
  "items": [
    {
      "id": "clzzz789...",
      "inventoryId": "clyyy456...",
      "customId": "BOOK-0001",
      "text1": "The Great Gatsby",
      "text2": "F. Scott Fitzgerald",
      "num1": 1925,
      "bool1": true,
      "likesCount": 5,
      "isLikedByCurrentUser": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 20,
  "hasMore": false
}
```

---

#### Update Item

```http
PATCH http://localhost:3000/api/items/clyyy456.../clzzz789...
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": 1,
  "text1": "The Great Gatsby (Updated)",
  "bool1": false
}
```

**Required fields:**

- `version` - For optimistic locking

**Response 200 OK:** Updated item object

---

#### Delete Items (Bulk)

```http
DELETE http://localhost:3000/api/items/clyyy456...
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "id": "clzzz789...", "version": 1 },
    { "id": "claaa111...", "version": 2 }
  ]
}
```

**Response 200 OK:**

```json
{
  "deleted": 2,
  "deletedIds": ["clzzz789...", "claaa111..."],
  "conflicts": 0,
  "conflictIds": [],
  "skipped": 0,
  "skippedIds": []
}
```

---

#### Like/Unlike Item

**Like:**

```http
POST http://localhost:3000/api/items/clyyy456.../clzzz789.../like
Authorization: Bearer <token>
```

**Unlike:**

```http
DELETE http://localhost:3000/api/items/clyyy456.../clzzz789.../like
Authorization: Bearer <token>
```

**Response 204 No Content**

---

#### Manage Collection Access

**Get access list:**

```http
GET http://localhost:3000/api/inventory/clyyy456.../access
Authorization: Bearer <token>
```

**Response 200 OK:**

```json
[
  {
    "userId": "cluuu222...",
    "inventoryRole": "EDITOR",
    "user": {
      "id": "cluuu222...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
]
```

**Grant/update access:**

```http
PUT http://localhost:3000/api/inventory/clyyy456.../access
Authorization: Bearer <token>
Content-Type: application/json

{
  "accesses": [
    {
      "userId": "cluuu222...",
      "inventoryRole": "EDITOR"
    },
    {
      "userId": "clvvv333...",
      "inventoryRole": "VIEWER"
    }
  ]
}
```

**Roles:**

- `OWNER` - Full control (auto-assigned to creator)
- `EDITOR` - Can edit collection and items
- `VIEWER` - Read-only access

**Response 200 OK:**

```json
{
  "processed": 2,
  "created": 1,
  "createdUserIds": ["cluuu222..."],
  "updated": 1,
  "updatedUserIds": ["clvvv333..."]
}
```

**Revoke access:**

```http
DELETE http://localhost:3000/api/inventory/clyyy456.../access
Authorization: Bearer <token>
Content-Type: application/json

{
  "userIds": ["cluuu222...", "clvvv333..."]
}
```

---

#### Admin: List Users

```http
GET http://localhost:3000/api/admin?search=john&page=1&perPage=20
Authorization: Bearer <admin-token>
```

**Response 200 OK:**

```json
{
  "items": [
    {
      "id": "clxxx123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 20,
  "hasMore": false
}
```

---

#### Admin: Block/Unblock Users

```http
POST http://localhost:3000/api/admin/users/block
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": ["clxxx123...", "clxxx456..."]
}
```

**Response 200 OK:**

```json
{
  "processed": 2,
  "processedIds": ["clxxx123...", "clxxx456..."],
  "skipped": 0,
  "skippedSuperAdminIds": []
}
```

**Note:** Super admins cannot be blocked

---

#### Get Latest Inventories

```http
GET http://localhost:3000/api/home/latest?limit=10
```

**Query parameters:**

- `limit` - Number of inventories (default: 10, max: 50)

**Response 200 OK:**

```json
[
  {
    "id": "clyyy456...",
    "name": "My Book Collection",
    "description": "Personal library",
    "imageUrl": "https://example.com/cover.jpg",
    "categoryId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "owner": {
      "id": "clxxx123...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "category": {
      "id": 1,
      "name": "Books"
    },
    "_count": {
      "Item": 42
    }
  }
]
```

---

#### Get Popular Inventories

```http
GET http://localhost:3000/api/home/popular?limit=5
```

**Query parameters:**

- `limit` - Number of inventories (default: 5, max: 20)

**Response 200 OK:**

```json
[
  {
    "id": "clyyy456...",
    "name": "My Book Collection",
    "description": "Most popular collection",
    "imageUrl": "https://example.com/cover.jpg",
    "categoryId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "owner": {
      "id": "clxxx123...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "category": {
      "id": 1,
      "name": "Books"
    },
    "_count": {
      "Item": 1523
    }
  }
]
```

**Note:** Sorted by number of items (descending)

---

#### Get Tag Cloud

```http
GET http://localhost:3000/api/home/tag-cloud?limit=50
```

**Query parameters:**

- `limit` - Number of tags (default: 50, max: 100)

**Response 200 OK:**

```json
[
  {
    "id": 1,
    "name": "fiction",
    "count": 125,
    "weight": 125
  },
  {
    "id": 2,
    "name": "science",
    "count": 89,
    "weight": 89
  },
  {
    "id": 3,
    "name": "history",
    "count": 67,
    "weight": 67
  }
]
```

**Note:**

- `count` and `weight` represent number of inventories using this tag
- Sorted by popularity (descending)
- Use `weight` for tag cloud font size calculation

---

#### Get Inventory Statistics

```http
GET http://localhost:3000/api/inventory/clyyy456.../statistics
Authorization: Bearer <token> (optional, required for private)
```

**Response 200 OK:**

```json
{
  "itemsCount": 42,
  "numericFields": {
    "num1": {
      "avg": 1985.5,
      "min": 1925,
      "max": 2024,
      "count": 42
    },
    "num2": {
      "avg": 299.99,
      "min": 9.99,
      "max": 899.99,
      "count": 38
    },
    "num3": {
      "avg": null,
      "min": null,
      "max": null,
      "count": 0
    }
  },
  "textFields": {
    "text1": [
      {
        "value": "Fiction",
        "count": 15
      },
      {
        "value": "Non-fiction",
        "count": 12
      },
      {
        "value": "Science Fiction",
        "count": 8
      }
    ],
    "text2": [
      {
        "value": "Hardcover",
        "count": 25
      },
      {
        "value": "Paperback",
        "count": 17
      }
    ],
    "text3": [],
    "long1": [],
    "long2": [],
    "long3": []
  },
  "firstItemCreatedAt": "2024-01-01T00:00:00.000Z",
  "lastItemCreatedAt": "2024-10-23T12:30:00.000Z"
}
```

**Statistics includes:**

- Total items count
- **Numeric fields:** average, min, max, count of non-null values
- **Text fields:** top 10 most frequent values with counts
- First and last item creation dates

**Response when no items:**

```json
{
  "itemsCount": 0,
  "numericFields": {},
  "textFields": {},
  "firstItemCreatedAt": null,
  "lastItemCreatedAt": null
}
```

---

## 🗄️ Database Schema

### Key Models Overview

The system uses **PostgreSQL** with **Prisma ORM** for type-safe database access.

#### User Model

- Stores authentication credentials (email/password or OAuth)
- Profile preferences (language, theme)
- Role-based permissions (USER, ADMIN)
- Account status (ACTIVE, BLOCKED)
- Optimistic locking via version field

#### Inventory Model

- Represents collections created by users
- Configurable visibility (public/private)
- Linked to categories for organization
- Version-controlled for concurrent update safety

#### InventoryFields Model

- One-to-one relationship with Inventory
- Defines 15 customizable fields (3 of each type)
- Field configuration includes:
  - State (HIDDEN/SHOWN)
  - Display name
  - Description/help text
  - Table visibility flag

#### Item Model

- Belongs to a specific Inventory
- Dynamic fields populated based on InventoryFields configuration
- Unique `customId` per inventory (auto-generated)
- Supports likes from multiple users
- Version-controlled

#### Access Control Models

- **InventoryAccess**: Manages sharing (OWNER/EDITOR/VIEWER roles)
- **Category**: Admin-managed classification
- **Tag**: Flexible many-to-many tagging
- **DiscussionPost**: Comments on collections

---

## 🔐 Authentication

### Supported Methods

1. **Email/Password**
   - Registration with bcrypt-hashed passwords
   - Login returns JWT token + user data

2. **Google OAuth2**
   - Client obtains Google ID token
   - Server verifies with Google Auth Library
   - Auto-creates user if first login

3. **Facebook OAuth**
   - Client obtains Facebook access token
   - Server validates and fetches profile
   - Auto-creates user if first login

### JWT Token

**Generated on:** Login, register, OAuth success  
**Contains:**

```text
{
  "sub": "user-id",
  "role": "USER" | "ADMIN",
  "version": 1,
  "iat": 1234567890,
  "exp": 1234999999
}
```

**Usage:** Include in `Authorization: Bearer <token>` header

**Expiration:** Configurable via `JWT_EXPIRES_IN` (default: 7 days)

### Authorization Levels

- **Public**: No auth required (public collections, categories, tags)
- **Authenticated**: Valid JWT token required
- **Owner/Editor**: Specific resource permissions
- **Admin**: Elevated privileges for all resources

---

## 🛡️ Security

### Built-in Protections

✅ **Password Security**

- Bcrypt with 10 salt rounds
- Never returned in responses
- Minimum 6 characters

✅ **HTTP Headers** (Helmet.js)

- XSS protection
- Content Security Policy
- Frame options
- HSTS support

✅ **CORS**

- Whitelist-based origins
- Credentials support
- Method restrictions

✅ **Input Validation**

- Zod schemas on all endpoints
- Type coercion
- Length/format constraints

✅ **SQL Injection**

- Prisma parameterized queries
- No raw SQL

✅ **Optimistic Locking**

- Version fields prevent lost updates
- 409 Conflict on mismatch

✅ **Super Admin Protection**

- Cannot be blocked
- Cannot be demoted
- Cannot be deleted

### Recommendations

⚠️ **Should Add:**

- Rate limiting (express-rate-limit)
- Request size limits
- Audit logging for admin actions
- HTTPS (via reverse proxy like Nginx)

---

## 📝 Development Guide

### Available NPM Scripts

```bash
# Development
npm run dev          # Start with watch mode
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix issues
npm run format       # Format with Prettier

# Database
npm run prisma:generate  # Regenerate client
npm run prisma:migrate   # Create migration
npm run prisma:push      # Push schema (dev only)
npm run prisma:studio    # Open GUI
npm run prisma:seed      # Run seed script

# Production
npm start            # Start server
```

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for formatting
- **Functional programming** preferred
- **Explicit types** over `any`
- **Zod schemas** for all external input

---

## 🎯 Key Technical Highlights

### Performance Optimizations

- **Database Indexing**
  - Full-text search indexes on `Item.searchVector`
  - Composite indexes on foreign keys
  - Unique constraints for data integrity
- **Query Optimization**
  - Select only required fields to minimize data transfer
  - Pagination to limit result sets
  - Efficient joins with Prisma relations

- **Concurrency Control**
  - Optimistic locking with version fields
  - Retry logic for ID generation conflicts
  - Transactional bulk operations

### Error Handling

- **Structured Error Responses**
  - Consistent error format across all endpoints
  - Descriptive error messages
  - HTTP status codes follow REST conventions
- **Validation**
  - Input validation with Zod schemas
  - Type coercion for query parameters
  - Custom error messages for user-friendly feedback

### Scalability Considerations

- **Stateless Authentication** - JWT tokens enable horizontal scaling
- **Connection Pooling** - Prisma manages database connections efficiently
- **Async Operations** - Non-blocking I/O throughout the application
- **Modular Architecture** - Easy to extract microservices if needed

---
