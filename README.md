# Notes System

A simple backend API for a messaging system between users built with NestJS and
TypeORM.

## Features

- **User Management**:
  - Register users with email and password
  - Login with JWT-based authentication
  - Update and delete user accounts
  - Upload profile pictures
- **Notes System**:
  - Send and receive notes between users
  - Full CRUD operations for notes
- **Security**:
  - Secure authentication using JWT
  - Password hashing with bcrypt
- **Developer Tools**:
  - Comprehensive Swagger API documentation
  - Unit tests for all features using Jest

## Tech Stack

- NestJS – Backend framework
- TypeORM – ORM for PostgreSQL
- PostgreSQL – Relational database
- JWT – Authentication
- Bcrypt – Password hashing
- Swagger – API documentation
- Jest – Testing framework

## API Endpoints

Below are the available API endpoints grouped by feature:

- Authentication
  - `POST /auth/login` – User login
  - `POST /auth/refresh` – Refresh access and refresh tokens
- Users
  - `POST /users` – Create a new user
  - `GET /users` – Get all users
  - `GET /users/{id}` – Get user details
  - `PATCH /users/{id}` – Update user profile
  - `DELETE /users/{id}` – Delete user account
  - `POST /users/upload-picture` – Upload profile picture
- Notes
  - `GET /notes` – Get all notes
  - `POST /notes` – Create a new note
  - `GET /notes/{id}` – Get note details
  - `PATCH /notes/{id}` – Update a note
  - `DELETE /notes/{id}` – Delete a note

> Note: All endpoints (except for authentication) require a valid JWT token in
> the Authorization header.
