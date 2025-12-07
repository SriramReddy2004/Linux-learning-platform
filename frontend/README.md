# Linux Learning Mentor - Frontend

React frontend for the AI-Powered Linux Learning Mentor platform.

## Features

- User authentication and registration
- Container management dashboard
- Interactive terminal (xterm.js)
- Real-time WebSocket communication
- Responsive design with Tailwind CSS
- State management with Zustand

## Prerequisites

- Node.js 18+

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

## Running

Development:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── store/          # State management
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Technologies

- React 18
- Vite
- React Router
- Socket.IO Client
- xterm.js
- Axios
- Zustand
- Tailwind CSS
- Lucide React (icons)

## License

MIT
