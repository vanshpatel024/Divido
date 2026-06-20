# Divido API Testing Guide

You can use these payloads to test your endpoints. Ensure your backend is running on `http://localhost:3000`.

---

## 1. Auth & Profiles

### 1.1 Sign Up
**POST** `http://localhost:3000/auth/signup`
```json
{
  "email": "testuser1@gmail.com",
  "password": "securepassword123",
  "displayName": "John Doe"
}
```

### 1.2 Log In
**POST** `http://localhost:3000/auth/login`
```json
{
  "email": "testuser1@gmail.com",
  "password": "securepassword123"
}
```
*Note: Extract the `access_token` from the response to use as a Bearer Token for the protected endpoints below.*

### 1.3 Get User Profile (Protected)
**GET** `http://localhost:3000/auth/me`
*Header:* `Authorization: Bearer YOUR_ACCESS_TOKEN`

### 1.4 Update Profile (Protected)
**PUT** `http://localhost:3000/auth/profile`
*Header:* `Authorization: Bearer YOUR_ACCESS_TOKEN`
```json
{
  "displayName": "Johnny Doe",
  "avatarUrl": "https://api.dicebear.com/7.x/initials/svg?seed=Johnny+Doe"
}
```

---

## 2. Trips

### 2.1 Get All Trips (Protected)
**GET** `http://localhost:3000/trips`
*Header:* `Authorization: Bearer YOUR_ACCESS_TOKEN`

### 2.2 Create Trip (Protected)
**POST** `http://localhost:3000/trips`
*Header:* `Authorization: Bearer YOUR_ACCESS_TOKEN`
```json
{
  "name": "Goa Vacation",
  "dates": "12 – 17 Mar 2026",
  "categories": ["food", "hotel", "transport", "entertainment"],
  "participants": [
    { "name": "Aarav", "color": "#AAD9BB" },
    { "name": "Isha", "color": "#F7DCB9" },
    { "name": "Vikram", "color": "#C9B7E0" },
    { "name": "Neha", "color": "#FBC4AB" }
  ]
}
```
