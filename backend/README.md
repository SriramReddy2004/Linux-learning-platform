# Linux Learning Mentor - Backend

Node.js/Express backend for the AI-Powered Linux Learning Mentor platform.

## Features

- User authentication with JWT
- Container lifecycle management
- WebSocket-based terminal sessions
- Resource monitoring and stats
- Session tracking and management
- Rate limiting and security
- Structured logging

## Prerequisites

- Node.js 18+
- Docker
- MongoDB

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── socket/         # WebSocket handlers
│   ├── utils/          # Utility functions
│   └── validators/     # Input validation
├── logs/               # Application logs
├── server.js           # Entry point
└── package.json
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/password` - Change password

### Containers
- POST `/api/containers` - Create container
- GET `/api/containers` - Get user containers
- GET `/api/containers/:id` - Get container details
- POST `/api/containers/:id/stop` - Stop container
- DELETE `/api/containers/:id` - Delete container
- GET `/api/containers/:id/stats` - Get container stats

### Sessions
- GET `/api/sessions` - Get user sessions
- GET `/api/sessions/:id` - Get session details

### Users (Admin only)
- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

## WebSocket Events

### Client → Server
- `start-shell` - Start terminal session
- `input` - Send command input
- `resize` - Resize terminal

### Server → Client
- `output` - Terminal output
- `shell-ready` - Session ready
- `shell-error` - Session error

## License

MIT
