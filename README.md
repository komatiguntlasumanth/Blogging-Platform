# Blogging Platform

A full-stack blogging application built with Node.js, Express, MongoDB, and Vanilla JavaScript.

## Features
- User Authentication (JWT)
- Create, Read, Update, and Delete Blog Posts
- Public Post Feed
- Personal Dashboard
- Responsive Premium Design

## Setup Instructions

### Backend
1. Navigate to the `backend` folder.
2. Run `npm install`.
3. Ensure MongoDB is running on `mongodb://localhost:27017/blogging_platform` (or update `.env`).
4. Run `node server.js`.

### Frontend
1. Open `frontend/index.html` in your browser.
2. (Optional) Use a local server like Live Server for the best experience.

## API Endpoints
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/posts` - Get all posts (Public)
- `POST /api/posts` - Create a post (Protected)
- `PUT /api/posts/:id` - Update a post (Protected)
- `DELETE /api/posts/:id` - Delete a post (Protected)
