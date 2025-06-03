# 📬 Notes System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Made with NestJS](https://img.shields.io/badge/made%20with-NestJS-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue.svg)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/docs-Swagger-brightgreen.svg)](http://localhost:3000/api)
[![Tests](https://img.shields.io/badge/tests-Jest-yellow.svg)](https://jestjs.io/)

A simple backend API for a messaging system between users, built with
[NestJS](https://nestjs.com/) and [TypeORM](https://typeorm.io/).

---

## ✨ Features

- **User Management**:

  - Register users with email and password
  - Login with JWT-based authentication
  - Update and delete user accounts
  - Upload profile pictures

- **Notes System**:

  - Send and receive notes between users
  - Full CRUD operations for notes

- **Security**:

  - Secure authentication using [JWT](https://jwt.io/)
  - Password hashing with [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

- **Developer Tools**:
  - Comprehensive [Swagger](https://swagger.io/) API documentation
  - Unit tests for all features using [Jest](https://jestjs.io/)

---

## 🛠 Tech Stack

- [NestJS](https://nestjs.com/) – Backend framework
- [TypeORM](https://typeorm.io/) – ORM for PostgreSQL
- [PostgreSQL](https://www.postgresql.org/) – Relational database
- [JWT](https://jwt.io/) – Authentication
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) – Password hashing
- [Swagger](https://swagger.io/) – API documentation
- [Jest](https://jestjs.io/) – Testing framework

---

## 📚 API Endpoints

All routes (except authentication) require a valid JWT in the `Authorization`
header.

### 🔐 Authentication

- `POST /auth/login` – User login
- `POST /auth/refresh` – Refresh access and refresh tokens

### 👤 Users

- `POST /users` – Create a new user
- `GET /users` – Get all users
- `GET /users/{id}` – Get user details
- `PATCH /users/{id}` – Update user profile
- `DELETE /users/{id}` – Delete user account
- `POST /users/upload-picture` – Upload profile picture

### 📝 Notes

- `GET /notes` – Get all notes
- `POST /notes` – Create a new note
- `GET /notes/{id}` – Get note details
- `PATCH /notes/{id}` – Update a note
- `DELETE /notes/{id}` – Delete a note

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
