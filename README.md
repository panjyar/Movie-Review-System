# 🎬 Movie Review System

Full-stack movie review platform with user authentication, TMDB integration, and admin dashboard.

**🚀 Live Demo:** https://movie-review-system-client-side.onrender.com

---

## 🛠️ Tech Stack

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)

### APIs & Tools
![TMDB](https://img.shields.io/badge/TMDB-01B4E4?style=flat&logo=themoviedatabase&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat&logo=mongoose&logoColor=white)

---

## ✨ Features

- 🔐 User authentication & profile management
- 🎥 Browse trending movies (TMDB API)
- ⭐ Write & manage reviews (1-5 stars)
- 👍 Like/dislike reviews
- 📝 Personal watchlist
- 👑 Admin dashboard
- 🛡️ Role-based access control

---

## 🚀 Quick Start

```bash
# Clone & Install
git clone https://github.com/panjyar/Movie-Review-System.git
cd server && npm install
cd ../client && npm install

# Setup .env (server/)
MONGODB_URI=mongodb://localhost:27017/moviereview
JWT_SECRET=your_secret_32_chars_minimum
TMDB_API_KEY=your_tmdb_key
CLIENT_URL=http://localhost:3000

# Run
npm run dev  # Backend (server/)
npm start    # Frontend (client/)
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/movies/trending` | Get trending movies |
| POST | `/api/movies/:id/reviews` | Submit review |
| GET | `/api/users/:id` | User profile |
| GET | `/api/admin/stats` | Admin dashboard |

---

## 🐛 Known Issues (Fixed)

**Critical bug resolved:** Changed `req.user.userId` → `req.user._id` in all routes.

**Files updated:**
- `routes/movies.js`
- `routes/reviews.js`
- `middleware/admin.js`

---

## 📦 Deployment

**Backend:** Set env vars on Render/Heroku  
**Frontend:** Set `REACT_APP_API_BASE_URL` on Vercel/Netlify

---

## 🔒 Security

- Bcrypt password hashing
- JWT tokens (7-day expiry)
- Rate limiting (100 req/15min)
- Input validation
- CORS protection

---

## 📄 License

MIT

---

Built with ❤️ using MERN Stack | Powered by TMDB API
