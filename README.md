# AI-Powered Linux Learning Mentor

A comprehensive platform for learning Linux through interactive containerized environments with real-time terminal access.

## 🚀 Features

- **User Management**: Complete authentication system with JWT
- **Container Management**: Create, manage, and monitor Docker containers
- **Interactive Terminal**: Real-time terminal access via WebSocket and SSH
- **Resource Monitoring**: Track CPU, memory, and network usage
- **Session Management**: Track user sessions and command history
- **Security**: Rate limiting, input validation, and role-based access control
- **Modern UI**: Responsive React frontend with Tailwind CSS

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB (handled by Docker Compose)

## 🛠️ Quick Start

### 1. Build the Play-with-Linux Image

First, build the custom Linux container image:

```bash
cd play-with-linux
docker build -t play-with-linux .
cd ..
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and change the JWT_SECRET to a secure random string.

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend API on port 3000
- Frontend on port 80

### 4. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost
- Backend API: http://localhost:3000/api

### 5. Create an Account

1. Go to http://localhost
2. Click "Sign up"
3. Create your account
4. Start creating containers!

## 📁 Project Structure

```
linux-learning-mentor/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── socket/         # WebSocket handlers
│   │   ├── utils/          # Utility functions
│   │   └── validators/     # Input validation
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── play-with-linux/       # Custom Linux container
│   └── Dockerfile
│
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## 🔧 Development Setup

### Backend Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local settings
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your local settings
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Container Endpoints

- `POST /api/containers` - Create new container
- `GET /api/containers` - Get user's containers
- `GET /api/containers/:id` - Get container details
- `POST /api/containers/:id/stop` - Stop container
- `DELETE /api/containers/:id` - Delete container
- `GET /api/containers/:id/stats` - Get container statistics

### Session Endpoints

- `GET /api/sessions` - Get user sessions
- `GET /api/sessions/:id` - Get session details

### WebSocket Events

**Client → Server:**
- `start-shell` - Start terminal session
- `input` - Send command input
- `resize` - Resize terminal

**Server → Client:**
- `output` - Terminal output
- `shell-ready` - Session ready
- `shell-error` - Session error

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control
- Helmet.js security headers
- CORS configuration

## 📊 Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Nginx     │◄───────►│   Backend   │
│  (React)    │         │  (Frontend) │         │  (Node.js)  │
└─────────────┘         └─────────────┘         └──────┬──────┘
                                                        │
                                        ┌───────────────┼───────────────┐
                                        │               │               │
                                   ┌────▼────┐    ┌────▼────┐    ┌─────▼─────┐
                                   │ MongoDB │    │  Docker │    │ WebSocket │
                                   │         │    │  Engine │    │  (SSH)    │
                                   └─────────┘    └────┬────┘    └───────────┘
                                                        │
                                                  ┌─────▼─────┐
                                                  │ Container │
                                                  │ (Ubuntu)  │
                                                  └───────────┘
```

## 🧪 Testing

Run tests:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time
- `DOCKER_HOST` - Docker socket path
- `DOCKER_IMAGE` - Container image name
- `CORS_ORIGIN` - Allowed CORS origin

### Frontend
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - WebSocket server URL

## 🚦 Container Resource Limits

Default limits per container:
- CPU: 50% of one core
- Memory: 512MB
- Network: Unlimited

These can be adjusted in `backend/src/config/docker.js`.

## 🔄 Container Lifecycle

1. User creates container via dashboard
2. Backend creates Docker container with SSH
3. Container starts and port is mapped
4. User connects to terminal
5. WebSocket established for real-time communication
6. SSH connection proxied through backend
7. User interacts with Linux environment
8. Container stopped/deleted when done

## 📈 Monitoring

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

Your Name - Initial work

## 🙏 Acknowledgments

- Docker for containerization
- xterm.js for terminal emulation
- Socket.IO for real-time communication
- React and the entire ecosystem

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@example.com

## 🗺️ Roadmap

- [ ] AI-powered command suggestions
- [ ] Tutorial system with guided exercises
- [ ] Multi-container networking
- [ ] Persistent storage volumes
- [ ] Container snapshots
- [ ] Collaborative sessions
- [ ] Integration with LMS platforms

---

**Note**: This is a B.Tech final year project demonstrating containerized Linux learning environments with modern web technologies.
