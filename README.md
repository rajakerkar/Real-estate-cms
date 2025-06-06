
# Real Estate CMS 🏠

A full-stack content management system for real estate companies to showcase their properties, manage listings, and allow customers to explore and connect with agents. Built using Node.js, Express, EJS, MongoDB, and more.

---

## 📌 About the Project

This project allows users to browse a variety of properties listed by different registered real estate companies. Users can view property details and contact the assigned agent if interested. Companies can register, login, and showcase their listings. 

The admin panel provides functionality to register companies, manage subscriptions, and control access for premium listings. This CMS can be extended for commercial use or customized for any real estate business model.

---

## 🚀 Features

### 👥 General Users
- Explore listed properties
- View detailed property pages
- Contact agent via provided details

### 🏢 Real Estate Companies
- Register and login
- Add and manage property listings
- Access company dashboard

### 👨‍💼 Admin Panel
- Register and manage real estate companies
- Offer and update subscription plans
- View and control dashboard analytics

---

## 🛠️ Tech Stack

| Category     | Technologies                          |
|--------------|----------------------------------------|
| Backend      | Node.js, Express.js, MongoDB, Mongoose |
| Frontend     | EJS templating, HTML, CSS              |
| Auth & Session | express-session, dotenv             |
| Utilities    | method-override, path, flash messages  |

---

## 🖼️ Screenshots

| Home Page | Admin Dashboard |
|-----------|------------------|
| ![Home](images/Home.png) | ![Admin Dashboard](images/admindashboard.png) |

| Product Listings | Register Page |
|------------------|----------------|
| ![Product](images/product.png) | ![Register](images/Register.png) |

---

## 📁 Project Structure

```

Real-estate-cms/
│
├── public/                 # Static assets (CSS, JS, images)
├── views/                 # EJS views/templates
│   ├── partials/          # Reusable EJS components
│   └── pages              # Full page templates
│
├── routes/                # Express route files (public, admin, company)
├── models/                # Mongoose schema definitions
├── .env                   # Environment configuration
├── app.js                 # Main Express server file
└── README.md              # Project documentation

````

---

## ⚙️ How to Run Locally

### 🔧 Prerequisites
- Node.js
- MongoDB (local or cloud)
- Git

### 📦 Install Dependencies

```bash
npm install
````

### 🌐 Configure Environment

Create a `.env` file in the root directory:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/real-estate-cms
SESSION_SECRET=your_secure_secret
```

### ▶️ Start the App

```bash
node app.js
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧾 License

This project is licensed under the MIT License.

---

## 🙌 Acknowledgements

Built with ❤️ by [Raj Akerkar](https://github.com/rajakerkar)

````

---

