# Divido API Testing Guide

You can use these payloads to test your authentication endpoints using tools like **Postman**, **Insomnia**, or **cURL**.

Make sure your backend server is running (`npm run dev` in the `Backend` directory) and listening on `http://localhost:3000`.

---

## 1. Sign Up a New User
**Endpoint:** `POST http://localhost:3000/auth/signup`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "email": "testuser1@example.com",
  "password": "securepassword123"
}
```

*Note: Supabase requires passwords to be at least 6 characters. If email confirmations are enabled in your Supabase project settings, you might need to confirm the email before logging in.*

---

## 2. Log In
**Endpoint:** `POST http://localhost:3000/auth/login`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "email": "testuser1@example.com",
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

**Expected Response:** You should receive your user profile details confirming the token is valid.

---

## 4. Log Out
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

## 5. Test Validation Errors
You can also test the Zod validation by sending invalid data to see the error responses.

**Endpoint:** `POST http://localhost:3000/auth/signup`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "email": "not-an-email",
  "password": "123"
}
```

**Expected Response:** A `400 Bad Request` showing the validation errors for both the invalid email and the short password.
