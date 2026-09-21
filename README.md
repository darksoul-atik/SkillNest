# SkillNest

<div align="center">

### 🌟 A Modern Full-Stack Platform for Hobbyists & Skill Sharing

**Build Communities • Share Skills • Connect with Passionate Learners & Creators**

</div>

---

## 📋 Overview

**SkillNest** is a full-stack monorepo combining a responsive, interactive frontend client and a high-performance Express REST API backend. It allows users to discover local and online hobby communities, create and host specialized groups, interact via threaded discussions and replies, manage member capacities, and connect with fellow enthusiasts.

---

## 📁 Repository Structure

```
SkillNest/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── assets/             # Icons, illustrations, and images
│   │   ├── components/         # Reusable UI cards, headers, footers, comments, reviews
│   │   ├── contexts/           # React context declarations (Auth, Theme, Toast)
│   │   ├── firebase/           # Firebase initialization & configuration
│   │   ├── layouts/            # Shared layouts (Mainlayout)
│   │   ├── pages/              # Routed pages (Home, AllGroups, GroupDetails, etc.)
│   │   ├── providers/          # Context providers (AuthProvider, ThemeProvider, ToastProvider)
│   │   ├── routes/             # Client router & PrivateRoute guard
│   │   └── utils/              # Helper utilities, animations, time counter, tailwind merge
│   ├── components/nurui/       # UI animation components
│   ├── index.html              # HTML entry template
│   ├── vite.config.js          # Vite configuration
│   ├── firebase.json           # Firebase Hosting rules
│   └── package.json            # Client dependencies (React 19, Tailwind 4, DaisyUI 5)
│
├── server/                     # Backend API Application
│   ├── index.js                # Express REST API, MongoDB pooling, CORS & route handlers
│   ├── vercel.json             # Vercel serverless deployment config
│   └── package.json            # Server dependencies (Express, MongoDB, dotenv, CORS)
│
├── package.json                # Monorepo root with npm workspaces & dev orchestration
├── .gitignore                  # Monorepo git ignore rules
└── README.md                   # Monorepo documentation
```

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Core**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [DaisyUI 5](https://daisyui.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/), [Swiper](https://swiperjs.com/)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/) (Email, Google, GitHub)
- **Feedback & Alerts**: [SweetAlert2](https://sweetalert2.github.io/), [React Hot Toast](https://react-hot-toast.com/)

### Backend (`server/`)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with connection pooling
- **Deployment**: [Vercel Serverless](https://vercel.com/) / Standalone Node process

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or newer)
- npm (v9.0 or newer)
- MongoDB Atlas database cluster
- Firebase Project for Authentication

### Installation

Clone the monorepo and install dependencies for both client and server:

```bash
git clone https://github.com/darksoul-atik/SkillNest.git
cd SkillNest

# Install dependencies for both client and server
npm run install:all
```

---

## ⚙️ Environment Configuration

### 1. Client Environment (`client/.env`)

Create a `.env` file in the `client/` directory based on `client/.env.example`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Server Environment (`server/.env`)

Create a `.env` file in the `server/` directory based on `server/.env.example`:

```env
PORT=3000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
```

---

## 💻 Running Locally

You can launch both the frontend and backend simultaneously from the root directory:

```bash
# Run both Client and Server concurrently
npm run dev

# Or run separately:
npm run dev:client    # Vite dev server on http://localhost:5173
npm run dev:server    # Express API server on http://localhost:3000
```

---

## 🌐 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check endpoint |
| `GET` | `/groups` | Fetch all hobby groups |
| `GET` | `/groups/:id` | Fetch details for a specific group |
| `POST` | `/groups` | Create a new hobby group |
| `PUT` | `/groups/:id` | Update an existing group |
| `DELETE` | `/groups/:id` | Delete a group |
| `PATCH` | `/groups/:id` | Update member roster (Join / Leave / Remove) |
| `GET` | `/groups/:groupId/comments` | Fetch all comments for a group |
| `POST` | `/groups/:groupId/comments` | Post a new comment |
| `PATCH` | `/groups/:groupId/comments/:commentId` | Edit comment text or add/edit reply |
| `DELETE` | `/groups/:groupId/comments/:commentId` | Delete a comment and its replies |
| `DELETE` | `/groups/:groupId/comments/:commentId/replies/:replyIndex` | Delete a specific reply |

---

## 📜 Available Scripts

From the repository root:
- `npm run dev`: Starts both client and backend servers concurrently.
- `npm run dev:client`: Starts only the Vite frontend.
- `npm run dev:server`: Starts only the Express backend.
- `npm run build`: Builds the production bundle for the client.
- `npm run lint:client`: Runs ESLint across client files.
- `npm run install:all`: Installs dependencies in both `client/` and `server/`.

---

## 📄 License

This project is licensed under the ISC License.
