# BHUB — Bouldering Hub

**BHUB** is a full-stack, offline-first mobile application built for indoor climbing gyms. It allows climbers to log route completions, share beta videos, interact on a community feed, and compete on live leaderboards.

![BHUB Features](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-brightgreen.svg)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)

## ✨ Core Features

* **Offline-First Architecture**: Powered by a local SQLite database on the device, allowing users to log sends and view routes even without an internet connection.
* **Live Cloud Syncing**: Automatically syncs local SQLite data with the central Node.js backend when online.
* **Real-time WebSockets**: Live updates for community posts and route completions using Socket.io.
* **Interactive Gym Map**: An SVG-based panning/zooming map to explore gym sectors and view routes.
* **Community Feed & Beta Videos**: Upload beta videos directly to the cloud, leave likes on posts, and view community achievements.
* **Leaderboards**: Compete with other gym members based on logged route grades.

---

## 🛠️ Technology Stack

* **Frontend**: React Native, React Navigation, React Native SVG, React Native Video
* **Local Storage**: `react-native-sqlite-storage`
* **Backend**: Node.js, Express.js, Socket.io, Multer (for media uploads)
* **Cloud Database**: SQLite (Node `sqlite3`)

---

## 🚀 Getting Started

This repository contains both the **React Native mobile app** and the **Node.js backend server**. You need to run both to experience the full cloud-synced application.

### 1. Start the Backend Server

The backend handles the cloud API, WebSockets, and media uploads.

```bash
# Open a terminal in your project root
npm run dev
# OR
node server.js
```
*The server will start on port `3001` and create a local `bhub.db` file for cloud data.*

### 2. Configure Your Network

If you are running the app on a physical device, you need to point the app to your computer's local IP address. 
* Open `src/api/cloudAPI.ts` and `src/api/websocket.ts`.
* Change `API_BASE_URL` and `WS_URL` from `10.0.2.2` (the Android Emulator gateway) to your computer's IPv4 address (e.g., `192.168.1.100`).

### 3. Start the Mobile App

Run the React Native Metro bundler and compile the Android app.

```bash
# Start the Metro bundler
npm start

# In a new terminal, build the Android app
npm run android
```

---

## 🗄️ Database Architecture

BHUB utilizes a two-tier database system to guarantee a snappy user experience regardless of internet connectivity:

1. **Local SQLite (`bhub.db` on device)**: 
   Stores the user's profile, offline route completions, cached community posts, and gym layout data. Seeded locally upon fresh installs.
2. **Cloud SQLite (`bhub.db` on server)**:
   The master database. Receives synced logs from users, aggregates leaderboard data, and hosts the uploaded video/image files in the `uploads/` directory.

## 🧹 Troubleshooting

* **Points/Leaderboard Mismatch**: If you uninstall the app from your emulator, your local app data resets to zero, but the cloud backend retains your old score! To completely wipe the slate clean, stop your Node server, delete the `bhub.db` file in your root folder, and restart the server.
* **Videos Not Playing**: Ensure your Node server is running. If on a physical device, ensure both your phone and PC are on the exact same WiFi network and your IP address is correctly configured in the API files.

---

*Built with ❤️ for the bouldering community.*
