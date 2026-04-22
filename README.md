<p align="center">
  <img src="docs/media/logo.png" alt="WordBomb logo" width="200" />
</p>

<h1 align="center">WordBomb</h1>

<p align="center">
  Real-time multiplayer word duel with timed combo challenges.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=111827" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=ffffff" alt="Vite" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-111827?style=flat-square&logo=socketdotio&logoColor=ffffff" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Node.js-Express-3c873a?style=flat-square&logo=nodedotjs&logoColor=ffffff" alt="Node" />
</p>

WordBomb is a fast party game where players must type a valid word containing the current letter combo before the bomb explodes. Miss your turn, lose a life. Last player alive wins.

## ✨ Highlights

- Real-time multiplayer private rooms
- Host controls and ready system
- Difficulty settings and shrinking turn timer
- Reconnect support and rematch voting
- Mobile + desktop friendly UI

## 🖼️ Screenshots

![Home](docs/media/lobby1.png)
![Lobby](docs/media/lobby2.png)
![Game](docs/media/game.png)
![Winner](docs/media/winner.png)

## ⚡ Quick Start

### ✅ Requirements

- Node.js 20.19.0+

### 📦 Install

```bash
npm install --prefix client
npm install --prefix server
```

### 🖥️ Run Server

```bash
npm run dev --prefix server
```

### 💻 Run Client

```bash
npm run dev --prefix client
```

### 🌐 Open

- Client: http://localhost:5173
- Server health: http://localhost:3002/health

## 🧰 Tech Stack

- Client: React, React Router, Vite, Socket.IO Client
- Server: Node.js, Express, Socket.IO
- Architecture: In-memory room + game engine

## 🌳 Project Structure

```text
wordbomb/
|-- client/
|   `-- src/
|       |-- components/
|       |-- hooks/
|       |-- pages/
|       |-- services/
|       |-- state/
|       |-- styles/
|       `-- utils/
`-- server/
    `-- src/
        |-- config/
        |-- data/
        |-- engine/
        |-- managers/
        `-- socket/
```

## 📝 Notes

- Game state is currently in-memory (no database yet).
- Great for local play and small deployments.
