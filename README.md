# ReciPeasy 🍳

> **CS 409 Web Programming - UIUC Final Project**

Transform your random ingredients into delicious, personalized recipes.

## Problem Statement & Motivation

College students often have a random mix of ingredients and want to eat healthier without spending extra time or money eating out. Preplanning meals is time-consuming, and jumping between multiple recipe websites wastes time and leads to unused groceries and food waste.

**ReciPeasy** simplifies this by turning the ingredients you already have into personalized recipe suggestions, ranked by:
- 📊 **Ingredient Match** - % of ingredients you already own
- 💪 **Protein Content** - Prioritize high-protein meals
- ⏱️ **Cooking Time** - Quick meals when you're busy

This helps students make fast, healthy meals with minimal effort and food waste.

---

## User Problems Addressed

| Problem | How ReciPeasy Solves It |
|---------|------------------------|
| Don't know what to cook with random groceries | Enter your ingredients, get instant recipe suggestions |
| Food waste from unused ingredients | Recipes ranked by what you already have |
| Health/nutrition constraints | Filter by protein goals and see nutritional breakdown |
| Time constraints | Filter by max cooking time |
| Jumping between recipe sites | Single, unified dashboard with saved favorites |

---

## Comparison to Similar Apps

| App | Pros | Cons |
|-----|------|------|
| **SuperCook.com** | Ingredient-based search | No protein/nutrition filters, no personalized ranking |
| **AllRecipes.com** | Huge database, keyword search | Not focused on using exact ingredients you have |
| **MyFitnessPal** | Great nutrition tracking | No ingredient-based recipe discovery |

### How ReciPeasy is Different
✅ Personalized recipe ranking by ingredient overlap  
✅ Protein-first filtering for fitness-minded students  
✅ Time constraint filters for busy schedules  
✅ Explicit nutritional breakdowns (protein, calories, macros)  
✅ Save preferences and favorites for repeat use  

---

## Tech Stack

- **Backend**: Node.js + Express (RESTful JSON API)
- **Database**: MongoDB Atlas
- **Frontend**: React + Vite
- **Authentication**: JWT + bcrypt
- **External API**: Spoonacular Recipe API

---

## Project Structure

```
/CS_Final_Project
├── README.md                 # This file
├── /server                   # Express backend
│   ├── index.js              # Server entry point
│   ├── /config               # Database & env configuration
│   ├── /routes               # API route definitions
│   ├── /controllers          # Request handlers
│   ├── /models               # MongoDB schemas
│   └── /middleware           # Auth middleware
├── /client                   # React frontend
│   ├── /src
│   │   ├── /pages            # Page components
│   │   ├── /components       # Reusable UI components
│   │   ├── /services         # API service layer
│   │   └── /context          # Auth context
│   └── vite.config.js
└── /docs                     # Documentation
    └── design-decisions-and-heuristics.md
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+ 
- npm or yarn
- MongoDB Atlas account
- Spoonacular API key (free tier available)

### 1. Clone & Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Environment Variables

Create a `.env` file in the `/server` directory:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/recipeasy?retryWrites=true&w=majority

# Frontend origins allowed by CORS (comma separated)
CLIENT_URLS=https://your-frontend.onrender.com,http://localhost:5173

# Optional: allow any origin (not recommended for production)
# ALLOW_ALL_CLIENTS=false

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Spoonacular API Key
SPOONACULAR_API_KEY=your-spoonacular-api-key

# Server Port
PORT=5000
```

> 🔐 **Deploying the frontend?** Make sure the backend knows which origins are allowed. Set `CLIENT_URLS` to a comma-separated list (for example `CLIENT_URLS=https://final-jcgw.onrender.com,http://localhost:5173`). Render preview URLs or additional domains can be added the same way. Only turn on `ALLOW_ALL_CLIENTS=true` for debugging.

Optionally, configure the client by creating `client/.env`:

```env
# Point the React app at your API (defaults to /api if omitted)
VITE_API_BASE_URL=http://localhost:5000/api

# Dev-server proxy target (falls back to the value above without /api)
VITE_API_PROXY_TARGET=http://localhost:5000
```

#### Render Deployment Checklist

If you're deploying the frontend as a static site on Render and the backend as a separate web service:

1. Deploy the Express server (`/server`) as a **Web Service** and note the public URL (for example `https://recipeasy-api.onrender.com`).
2. Deploy the React app (`/client`) as a **Static Site** and add the following environment variables in the Render dashboard before building:
   - `VITE_API_BASE_URL=https://recipeasy-api.onrender.com/api`
   - (optional) `VITE_API_PROXY_TARGET=https://recipeasy-api.onrender.com`
3. Trigger a new build. The frontend will now send requests to the live backend instead of trying to hit `/api` on the static site (which results in missing recipe data).

#### Runtime API base overrides

If you ever need to update the API target without rebuilding the frontend:

- Append `?apiBase=https://your-api.onrender.com/api` to the site URL. The app stores this override in `localStorage` and removes the query parameter for you.
- To clear the stored override, visit the site with `?clearApiBase=true`.
- Advanced deployments can also set `window.__RECIPEASY_API_BASE_URL__` before loading the bundle to inject a runtime base URL.

When no custom value is provided in production builds, the client now falls back to `https://recipeasy-api.onrender.com/api`, ensuring the Render demo stays functional even if an environment variable is missed.

**Getting API Keys:**
- **MongoDB Atlas**: Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- **Spoonacular**: Get a free API key at [spoonacular.com/food-api](https://spoonacular.com/food-api)

### 3. Run the Application

**Development Mode (two terminals):**

```bash
# Terminal 1 - Start backend server
cd server
npm run dev

# Terminal 2 - Start frontend dev server
cd client
npm run dev
```

**Or run both concurrently from root:**
```bash
# From project root
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new user | No |
| POST | `/api/auth/login` | Login, get JWT | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Recipes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/recipes/search` | Search recipes by ingredients | No |
| GET | `/api/recipes/:id` | Get recipe details | No |

### Favorites
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/favorites` | Get user's favorites | Yes |
| POST | `/api/favorites` | Add a favorite | Yes |
| DELETE | `/api/favorites/:recipeId` | Remove a favorite | Yes |

---

## Feature to Requirement Mapping

| Course Requirement | Implementation |
|-------------------|----------------|
| **User Authentication** | JWT-based auth with bcrypt password hashing (`/api/auth/*`) |
| **RESTful API** | Express routes for auth, recipes, favorites |
| **Database** | MongoDB Atlas with User and Favorite schemas |
| **External API Integration** | Spoonacular API for recipe data |
| **UX/UI Design** | Responsive React UI with mobile-first design |
| **Heuristic Evaluation** | Documented in `/docs/design-decisions-and-heuristics.md` |

---

## Features

### 🔐 User Authentication
- Secure signup/login with email and password
- JWT tokens for session management
- Protected routes for favorites

### 🔍 Smart Recipe Search
- Enter comma-separated ingredients
- Filter by minimum protein
- Filter by maximum cooking time
- Results ranked by ingredient match → protein → time

### 📊 Nutritional Information
- Calories per serving
- Protein grams highlighted
- Full ingredient list with user's ingredients highlighted

### ⭐ Favorites System
- Save recipes for later
- View all saved recipes
- Quick unfavorite action

### 📱 Responsive Design
- Mobile-first approach
- Works on phones, tablets, and desktops
- Clean, modern card-based UI

---

## Development

```bash
cd server && npm run dev

cd client && npm run dev

cd client && npm run lint
```

---

## Authors

Built for UIUC CS 409 Web Programming

---

## License

MIT License - Educational use for CS 409 Final Project

