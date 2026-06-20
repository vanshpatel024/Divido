# Divido API Testing Guide

You can use these payloads to test your authentication and profile endpoints using tools like **Postman**, **Insomnia**, or **cURL**.

Make sure your backend server is running (`npm run dev` in the `Backend` directory) and listening on `http://localhost:3000`.

---

## 1. Sign Up a New User
**Endpoint:** `POST http://localhost:3000/auth/signup`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "email": "testuser1@gmail.com",
  "password": "securepassword123",
  "displayName": "John Doe"
}
```

*Note: The `displayName` is optional. If provided, the database trigger will use it to set up their profile and initial avatar. If omitted, it will default to their email prefix (e.g. `testuser1`).*

---

## 2. Log In
**Endpoint:** `POST http://localhost:3000/auth/login`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "email": "testuser1@gmail.com",
  "password": "securepassword123"
}
```

**Expected Response:** You will receive a success response containing your `user` details and a `session`. Look inside the `session` object for the `access_token`. You will need this token for the next step.

---

## 3. Get User Profile (Protected Route)
**Endpoint:** `GET http://localhost:3000/auth/me`
**Headers:** 
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN_HERE`

*Replace `YOUR_ACCESS_TOKEN_HERE` with the token you received from the login response.*

**Expected Response:** You will receive the authentication user object along with the resolved `profile` database details (display name, avatar URL, etc.).

---

## 4. Update Profile (Protected Route)
**Endpoint:** `PUT http://localhost:3000/auth/profile`
**Headers:** 
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN_HERE`
- `Content-Type`: `application/json`

**Body (JSON):**
```json
{
  "displayName": "Johnny Doe",
  "avatarUrl": "https://api.dicebear.com/7.x/initials/svg?seed=Johnny+Doe"
}
```

**Expected Response:** The updated profile database record showing your changes.

---

## 5. Log Out
**Endpoint:** `POST http://localhost:3000/auth/logout`
**Headers:** 
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN_HERE`

**Expected Response:**
```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

---

## 6. Test Validation Errors
You can also test the Zod validation by sending invalid data to see the error responses.

**Endpoint:** `POST http://localhost:3000/auth/signup`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "email": "not-an-email",
  "password": "123",
  "displayName": "A"
}
```

**Expected Response:** A `400 Bad Request` showing validation errors (invalid email, too short password, and too short display name).
