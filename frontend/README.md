# User Access Management module

A User Access Management (UAM) dashboard built in React + TypeScript with an Express + Prisma backend. This module simulates Role-Based Access Control (RBAC) where an admin, manager, or viewer can simulate actions and permissions dynamically enforced via the `x-actor-role` HTTP header.

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or newer recommended)
- **PostgreSQL** 

---

### 1. Clone the Repository

Start by cloning the project repository to your local machine and navigating into the project root directory:
```bash
git clone https://github.com/OswaldLoh/UserManagementModule.git
cd UserManagement/frontend
```

---

### 2. Backend Setup (API & Database)

The backend is built with Express.js, TypeScript, and Prisma ORM connecting to a PostgreSQL database.

#### Step 1: Install Backend Dependencies
Navigate to the backend directory and install the required packages:
```bash
cd backend
npm install
```

#### Step 2: Configure the Database (`DATABASE_URL`)
Create a `.env` file in the root of the `backend/` directory:
```bash
New-Item .env -ItemType File
```
Inside the `.env` file, define the `DATABASE_URL` connection string pointing to the PostgreSQL instance:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/usermanagement?schema=public"
```
*(Replace `username`, `password`, `localhost`, and `usermanagement` with your actual database credentials).*

#### Step 3: Run Prisma Migration & Seeding
With your database running and configured, run the following commands to generate the Prisma client, create the schema tables, and populate the database with initial Roles, Permissions, and Users:
```bash
# Generate the Prisma Client types
npx prisma generate

# Apply migrations to create database tables
npx prisma migrate dev --name init

# Populate the database with default seed data
npm run seed
```
*(Note: The seed script populates 3 core roles—Admin, Manager, Viewer—along with their respective permissions and sample team members).*

#### Step 4: Start the Backend API Server
Start the Express server on port 3000 using `tsx`:
```bash
npx tsx index.ts
```
The backend API will now be listening at `http://localhost:3000`.

---

### 3. Frontend Setup (React Dashboard)

The frontend is built with React 19, TypeScript, and Vite, styled entirely in custom, responsive vanilla CSS.

#### Step 1: Install Frontend Dependencies
Open a new terminal window/tab, navigate to the main `frontend/` root directory, and install dependencies:
```bash
# From the project root (frontend directory)
npm install
```

#### Step 2: Start the Frontend Development Server
Launch the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5174/` (or the local port shown in your terminal) to view the User Access Management portal.

---
