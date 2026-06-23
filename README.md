# 🚀 Real-Time Chat Application (Spring Boot + WebSocket)

A scalable **real-time chat application** built using **Spring Boot**, **WebSocket**, and **MongoDB**.

This application enables users to send **instant messages, create groups, share files, and view online users** in real time.

The backend is deployed on **Render**, and the database is hosted on **MongoDB Atlas**.

---

## 🌐 Live Deployment

Backend URL

https://websocket-chat-app-yv9q.onrender.com

---

## 🛠 Tech Stack

### Backend
- Spring Boot
- WebSocket
- STOMP Protocol
- Spring Data MongoDB
- MongoDB

### Frontend
- HTML
- CSS
- JavaScript

### Deployment
- Render
- MongoDB Atlas

---

## ✨ Features

### Real-time messaging
Users can send and receive messages instantly using WebSocket connections.

### Private messaging
Users can chat directly with another user.

### Group chat
Users can create groups and communicate with multiple members.

### Online user tracking
The system shows which users are currently online.

### File sharing
Users can send images and documents in chats.

### Message persistence
All chat messages are stored in MongoDB for history retrieval.

### Message notifications
Unread messages are indicated with counters.

---

## 🏗 System Architecture
Frontend (HTML / JS)
│
│ WebSocket + REST API
▼
Spring Boot Backend
│
│ Spring Data MongoDB
▼
MongoDB Atlas


---

## 🔌 WebSocket Communication

### Connection endpoint


/ws


### Client Send Endpoints


/app/chat
/app/group.chat
/app/user.addUser
/app/user.disconnectUser


### Subscription Topics


/user/queue/messages
/topic/public
/topic/groups
/topic/group/{groupId}


---

## 📡 REST API Endpoints

### Get online users


GET /users


### Get private messages


GET /messages/{senderId}/{recipientId}


### Create a group


POST /groups


### Get groups for a user


GET /groups/{nickname}


### Get group chat history


GET /group/messages/{groupId}


### Upload files


POST /upload


---

## 📂 Project Structure


src
└── main
├── java
│ └── com.chat.websocket
│   ├── chat
│   ├── chatroom
│   ├── config
│   ├── user
│   └── websocket
│
└── resources
├── static
└── application.yml


---

## 💻 Local Setup

### 1 Clone repository


git clone https://github.com/vankayalakoutilya7/websocket-chat-app.git


### 2 Navigate into project


cd websocket-chat-app


### 3 Configure MongoDB

Local MongoDB example


mongodb://localhost:27017/chat_app


### 4 Run application


mvn spring-boot:run


Open in browser


http://localhost:8080


---

## ☁ Deployment

### Backend Deployment (Render)

Steps

1. Push project to GitHub
2. Connect repository in Render
3. Configure environment variables
4. Deploy automatically

Environment Variables


SPRING_DATA_MONGODB_URI
PORT


---

### Database Deployment (MongoDB Atlas)

Steps

1. Create Atlas cluster
2. Create database user
3. Allow network access (0.0.0.0/0)
4. Copy connection string
5. Add it to Render environment variables

---

## 👨‍💻 Author

**Koutilya Vankayala**

B.Tech – IIIT Vadodara

GitHub  
https://github.com/vankayalakoutilya7

---

## 📜 License

This project is open-source and available under the MIT License.
