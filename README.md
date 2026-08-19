# 🚀 DropIt

DropIt is a full-stack file sharing application that enables users to upload files or folders and share them through a unique link. The application is built with a modular backend architecture and a responsive React frontend, focusing on simplicity, performance, and maintainability.

---

## ✨ Features

- Upload single or multiple files
- Upload complete folders
- Generate unique shareable links
- Download shared files and folders
- Automatic ZIP creation for folder downloads
- Automatic cleanup of expired shares
- Responsive user interface
- RESTful API architecture
- Organized backend with MVC pattern

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer
- Archiver
- NanoID

---

## 📂 Project Structure

```text
DropIt
├── frontend
│   ├── src
│   └── public
│
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── db
│   │   ├── middlewares
│   │   ├── models
│   │   ├── routes
│   │   ├── tasks
│   │   ├── utils
│   │   ├── app.js
│   │   └── index.js
│   │
│   ├── public
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/<your-username>/dropit.git
cd dropit
```

### Install Dependencies

Frontend

```bash
cd frontend
npm install
```

Backend

```bash
cd ../backend
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

---

## ▶️ Run the Project

Start the backend server

```bash
cd backend
npm run dev
```

Start the frontend

```bash
cd frontend
npm run dev
```

---

## 📖 How It Works

1. Users upload one or more files or an entire folder.
2. Files are stored on the server while metadata is saved in MongoDB.
3. A unique share ID is generated using NanoID.
4. The generated link can be shared with others.
5. When a folder is downloaded, it is compressed into a ZIP archive.
6. A scheduled cleanup task removes expired shares and their associated files.

---

## 🏛️ Backend Architecture

The backend follows the MVC (Model–View–Controller) architecture.

- **Controllers** – Handle incoming requests and business logic.
- **Models** – Define MongoDB schemas using Mongoose.
- **Routes** – Map API endpoints to controllers.
- **Middlewares** – Handle request processing and validation.
- **Tasks** – Execute scheduled background jobs such as expired share cleanup.
- **DB** – Configure the MongoDB connection.
- **Utils** – Store reusable helper functions.

---
---

## System Architecture

flowchart LR

    %% Users
    U1[User 1]
    U2[User 2]
    UN[User N]

    %% Main Application
    F[DropIt<br/>Frontend<br/><br/>React + Vite]

    B[DropIt<br/>Backend<br/><br/>Node.js + Express]

    %% Backend Architecture
    R[REST API<br/>Routes]
    C[Controllers<br/>Business Logic]
    M[Models<br/>Mongoose]

    %% File Handling
    MU[Multer<br/>File Upload]
    AR[Archiver<br/>ZIP Creation]

    %% Background Services
    CL[Cleanup Task<br/>Expired Shares]

    %% Data & Storage
    DB[(MongoDB<br/>Share Metadata)]
    FS[(Server File Storage<br/>Uploaded Files)]

    %% Utility
    NI[NanoID<br/>Share ID Generator]

    %% User Flow
    U1 --> F
    U2 --> F
    UN --> F

    %% Frontend → Backend
    F -->|HTTP / REST API| B

    %% Backend Architecture
    B --> R
    R --> C

    %% Upload Flow
    C -->|Upload| MU
    MU -->|Store Files| FS

    %% Metadata
    C -->|Create / Retrieve Metadata| M
    M --> DB

    %% Share ID
    C -->|Generate Share ID| NI
    NI --> C

    %% Download Flow
    C -->|Request Files| FS
    FS -->|File Data| C

    %% ZIP Creation
    C -->|Multiple Files / Folder| AR
    FS -->|Files| AR
    AR -->|ZIP Archive| C

    %% Response to Frontend
    C -->|Share Link / File Info / Download| F

    %% Cleanup
    CL -->|Remove Expired Metadata| DB
    CL -->|Remove Expired Files| FS

    %% Styling
    classDef user fill:#eef4ff,stroke:#4a78c2,stroke-width:2px
    classDef app fill:#f5f0ff,stroke:#7957b5,stroke-width:2px
    classDef service fill:#fff4e5,stroke:#d98b28,stroke-width:2px
    classDef storage fill:#eef8ee,stroke:#4b9b4b,stroke-width:2px
    classDef utility fill:#f1f1f1,stroke:#666,stroke-width:2px

    class U1,U2,UN user
    class F,B app
    class R,C,M,MU,AR,CL service
    class DB,FS storage
    class NI utility
    
---
## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/share/upload` | Upload files or folders |
| GET | `/api/share/:shareId` | Retrieve shared file information |
| GET | `/api/share/download/:shareId` | Download shared files |

---

## 🔮 Future Improvements

- User authentication
- Password-protected share links
- Upload progress indicator
- Cloud storage integration
- File previews
- Download analytics
- QR code sharing
- Configurable link expiration

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---


## 👨‍💻 Author

**Saurabh**

If you found this project helpful, consider giving it a ⭐ on GitHub.
