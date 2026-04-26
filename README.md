# 📱 Electro Mobile App

A scalable **React Native mobile application** for the Electro E-commerce platform, supporting both **users** and **sellers** with a complete shopping experience.

---

## 📌 Overview

This mobile app is part of a full-stack e-commerce system, allowing:

### 👤 Users

* Browse and search products
* Add to cart and checkout
* Track orders
* Manage profile and addresses

### 🧑‍💼 Sellers

* Create and manage products
* Track and update orders

---

## 🛠 Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Framework  | React Native CLI              |
| Navigation | React Navigation              |
| State      | Context API / Redux           |
| API        | RESTful API                   |
| Auth       | Firebase Authentication / JWT |

---

## ✨ Key Features

### 🛍 Shopping Experience

* Product listing & detail view
* Search and filtering

### 🛒 Cart & Orders

* Add to cart
* Checkout flow
* Order tracking

### 👤 User Profile

* Profile management
* Address management

### 🧑‍💼 Seller Features

* Product CRUD
* Order management

---

## 🌐 API Integration

The app connects to the backend API:

```bash
https://your-backend.onrender.com/api/v1
```

---

## ⚙️ Installation

```bash
git clone https://github.com/TruongQuocHuy-dev/ecommerce-mobile.git
cd ecommerce-mobile
npm install
```

---

## ▶️ Running the App

### . Run on Android

```bash
npx react-native run-android
```


---

## 📁 Project Structure

```bash
src/
├── features/        # Business logic modules
├── components/      # Reusable UI components
├── navigation/      # Navigation setup
├── services/        # API calls
├── hooks/           # Custom hooks
├── utils/           # Helper functions
```

---

## 🔐 Environment Variables

Create a `.env` file:

```env
API_URL=https://your-backend.onrender.com
```

---

## 📦 Build APK (Android)

```bash
cd android
./gradlew assembleRelease
```

---

## 🧩 Related Projects

* Backend: https://github.com/TruongQuocHuy-dev/ecommerce-backend
* Admin Dashboard: https://github.com/TruongQuocHuy-dev/ecommerce-admin

---

## 🚀 Future Improvements

* Push notifications
* Payment integration
* Real-time chat
* Performance optimization

---

## 👤 Author

* GitHub: https://github.com/TruongQuocHuy-dev
* Email: [tqhuy.dev.frontend@gmail.com](mailto:tqhuy.dev.frontend@gmail.com)

---

## ⭐️ Support

If you find this project helpful, feel free to give it a ⭐️
