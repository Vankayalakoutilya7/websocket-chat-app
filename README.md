# ChatMe — Real-Time Chat Application

> A production-deployed, full-stack chat application built with Spring Boot, WebSocket (STOMP), and MongoDB Atlas. Supports private messaging, group chats, file sharing, and live online-user tracking.

**Live Demo:** [https://websocket-chat-app-1-u0se.onrender.com](https://websocket-chat-app-1-u0se.onrender.com)  
**GitHub:** [https://github.com/vankayalakoutilya7/websocket-chat-app](https://github.com/vankayalakoutilya7/websocket-chat-app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.3, Spring WebSocket, STOMP |
| Database | MongoDB Atlas (cloud), Spring Data MongoDB |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Deployment | Render (backend), MongoDB Atlas (database) |
| Build | Maven, Docker |

---

## Features

- **Private messaging** — one-to-one real-time chat using WebSocket and STOMP user destinations
- **Group chat** — create named groups, add members by nickname, broadcast messages to all members
- **File sharing** — upload and send images and documents; files rendered inline for images, as download links for documents
- **Online user tracking** — sidebar shows currently connected users; presence updates on join/leave via `/topic/public`
- **Unread message badges** — per-conversation unread counters that persist across the 3-second presence poll
- **Message history** — all messages persisted in MongoDB and loaded when opening a conversation
- **Persistent storage** — MongoDB Atlas stores users, chat rooms, messages, and groups across sessions

---

## Architecture

```
Browser (HTML / CSS / JS)
        │
        │  SockJS + STOMP (WebSocket)
        │  REST (fetch API)
        ▼
Spring Boot Application (Render)
        │
        │  Spring Data MongoDB
        ▼
MongoDB Atlas (Replica Set, AWS ap-south-1)
```

The backend uses Spring's `SimpMessagingTemplate.convertAndSendToUser()` combined with a custom `WebSocketUserInterceptor` that maps each STOMP session to its nickname principal at connect time. This allows user-specific message routing without authentication middleware.

---

## WebSocket Design

The application uses **STOMP over SockJS** for WebSocket communication, which provides automatic fallback to HTTP long-polling in restrictive network environments.

### Connection Endpoint
```
/ws  (SockJS)
```

### Client → Server (send)
| Destination | Purpose |
|---|---|
| `/app/chat` | Send a private message |
| `/app/group.chat` | Send a group message |
| `/app/user.addUser` | Register user as online |
| `/app/user.disconnectUser` | Mark user as offline |

### Server → Client (subscribe)
| Topic | Purpose |
|---|---|
| `/user/queue/messages` | Private messages for the connected user |
| `/topic/public` | User join/leave presence events |
| `/topic/groups` | New group creation broadcasts |
| `/topic/group/{groupId}` | Messages for a specific group |

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Get all online users |
| `GET` | `/messages/{senderId}/{recipientId}` | Fetch private chat history |
| `POST` | `/groups` | Create a new group |
| `GET` | `/groups/{nickname}` | Get groups for a user |
| `GET` | `/group/messages/{groupId}` | Fetch group message history |
| `POST` | `/upload` | Upload a file, returns URL |

---

## Project Structure

```
src/main/java/com/chat/websocket/
├── chat/                  # Private messaging (ChatMessage, ChatMessageController,
│                          #   ChatMessageService, ChatNotification, ChatMessageRepository)
├── chatroom/              # Chat room ID management (ChatRoom, ChatRoomService)
├── GroupChat/             # Group messaging (GroupMessage, GroupMessageController)
├── Group/                 # Group management (Group, GroupController, GroupService)
├── user/                  # User presence (User, UserController, UserService, Status)
├── file/                  # File upload endpoint (FileController)
├── config/                # WebSocket config, CORS, MVC resource handlers,
│                          #   WebSocketUserInterceptor (STOMP principal mapping)
└── WebsocketApplication.java

src/main/resources/
├── static/
│   ├── index.html         # Single-page chat UI
│   ├── css/main.css       # Dark theme design
│   └── js/main.js         # WebSocket client, DOM, notifications
└── application.yml
```

---

## Key Technical Decisions

**Why STOMP over raw WebSocket?**  
STOMP adds a pub/sub messaging layer on top of WebSocket, giving named destinations, user-specific routing, and message acknowledgement — without needing a separate message broker like RabbitMQ.

**Why `convertAndSendToUser()` instead of `convertAndSend()`?**  
Spring's user-destination prefix (`/user`) only works correctly with `convertAndSendToUser()`. Using `convertAndSend("/user/{id}/queue/messages")` bypasses the session registry and messages are silently dropped. The `WebSocketUserInterceptor` sets the STOMP principal at connect time so the framework can resolve the correct session.

**Why MongoDB?**  
The chat domain maps naturally to documents — messages, rooms, and users all have variable shapes and don't require joins. MongoDB's flexible schema also made it easy to add group chat alongside the existing private chat without schema migrations.

---

## Local Setup

**Prerequisites:** Java 17+, Maven 3.8+, MongoDB (local or Atlas URI)

```bash
# 1. Clone
git clone https://github.com/vankayalakoutilya7/websocket-chat-app.git
cd websocket-chat-app

# 2. Set MongoDB URI in src/main/resources/application.yml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/chatdb   # local
      # or your Atlas URI

# 3. Run
./mvnw spring-boot:run

# 4. Open
http://localhost:8080
```

To test real-time messaging: open two browser tabs, log in with different nicknames, and start a conversation.

---

## Deployment (Render + MongoDB Atlas)

### MongoDB Atlas
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user under **Database Access**
3. Allow all IPs under **Network Access** (`0.0.0.0/0`)
4. Copy the connection string (`mongodb+srv://...`)

### Render
1. Push the project to GitHub
2. Create a new **Web Service** on [render.com](https://render.com), connect the repo
3. Set **Environment** to `Docker`
4. Add environment variables:

| Variable | Value |
|---|---|
| `SPRING_DATA_MONGODB_URI` | Your Atlas connection string with `/chatdb` database name |
| `PORT` | Set automatically by Render |

Render builds the Docker image and deploys on every push to `main`.

---

## Author

**Koutilya Vankayala**  
B.Tech — IIIT Vadodara  
[github.com/vankayalakoutilya7](https://github.com/vankayalakoutilya7)

---

## License

MIT License — open source and free to use.
