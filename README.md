# 🍽️ Restaurant Finder

Welcome to **Restaurant Finder** – a modern, mobile-friendly web app to discover, filter, and save restaurants in Singapore!  
Built with **React**, **FastAPI**, and **Supabase**.

---

## 🚀 Features

- 🗺️ **Interactive Map** (Singapore only, powered by react-leaflet)
- 🔍 **Search & Filter** restaurants by cuisine, price, rating, and more
- 💾 **Save/Unsave** your favorite restaurants (with heart icon)
- 👤 **User Authentication** (Sign up, Sign in, Password reset via Supabase)
- 📝 **Profile Page**: View/remove saved restaurants, reset password
- 🛠️ **Admin Dashboard**: Manage users (CRUD) for admins
- 📱 **Mobile Responsive**: Optimized for all devices
- ⚡ **Optimistic UI**: Fast, smooth interactions

---

## 🏗️ Tech Stack

| Frontend         | Backend         | Database/Auth   | Map         |
|------------------|----------------|-----------------|-------------|
| React + Vite     | FastAPI (Python)| Supabase        | react-leaflet|

---

## 📦 Project Structure

```
Summerbuild/
│
├── backend/                # FastAPI backend & recommendation engine
│   └── rec_engine/         # Custom recommendation logic
│
├── restaurant-finder/      # React frontend
│   ├── src/
│   │   ├── components/     # UI components (map, profile, admin, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API, Supabase, utilities
│   │   └── contexts/       # Auth context
│   ├── public/             # Static assets (icons, pins)
│   └── ...                 # Config, styles, etc.
│
├── admin-api.js            # Express API for admin user management
└── README.md               # This file!
```

---

## 🛠️ Getting Started

### 1. **Clone the Repo**

```bash
git clone https://github.com/your-username/your-repo.git
cd Summerbuild
```

### 2. **Set Up the Backend (FastAPI)**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. **Set Up the Frontend (React + Vite)**

```bash
cd ../restaurant-finder
npm install
npm run dev
```

### 4. **Supabase Setup**

- Create a project at [Supabase.io](https://supabase.io)
- Set up authentication and a `profiles` table (see `SUPABASE_SETUP.md`)
- Add your Supabase keys to `restaurant-finder/src/lib/supabase.js`

### 5. **Admin API (Optional, for user management)**

```bash
node admin-api.js
```
- Requires Supabase Service Role Key (see code comments).

---

## 🔑 Environment Variables

- **Frontend:**  
  Configure Supabase URL and anon key in `restaurant-finder/src/lib/supabase.js`
- **Backend:**  
  Set up your Supabase service role key and database URL as needed.

---

## 👨‍💻 Contributing

1. Fork this repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License.  
Feel free to use, modify, and contribute!

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.io)
- [React](https://react.dev)
- [FastAPI](https://fastapi.tiangolo.com/)
- [react-leaflet](https://react-leaflet.js.org/)

---

## 💬 Questions?

Open an issue or contact the maintainer!
