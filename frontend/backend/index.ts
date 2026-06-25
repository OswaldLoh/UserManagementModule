import 'dotenv/config';
import express, { Request } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

interface AuthRequest extends Request {
  userPermissions: string[];
}

const app = express();
const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = 3000;

// Middleware
app.use(cors()); // Allows your React app to communicate with this API
app.use(express.json()); // Parses incoming JSON data

// RBAC Mock middleware

app.use(async (req, res, next) => {
  const roleName = req.headers['x-actor-role'] as string;

  if (!roleName) {
    return res.status(401).json({ error: 'Missing x-actor-role header. Select a role in the UI.' });
  }

  // Look up the role in the database to get its permissions
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  if (!role) {
    return res.status(403).json({ error: 'Invalid role provided.' });
  }

  // Attach the mapped permissions to the request object so our endpoints can check them
  const allowedActions = role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`);
  (req as AuthRequest).userPermissions = allowedActions;

  next(); // Pass control to the requested endpoint
});

// Endpoints

// GET /api/users - Fetch all users
app.get('/api/users', async (req, res) => {
  const permissions = (req as AuthRequest).userPermissions;

  // Ensures user has "read" permission
  if (!permissions.includes('user:read')) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to read users.' });
  }

  try {
    const users = await prisma.user.findMany({
      include: { role: true }, // Join the role data so the frontend can display the role name
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/roles - Fetch all roles
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } }
      }
    });
    res.json(roles);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/users - Create a user (Admin only)
app.post('/api/users', async (req, res) => {
  const permissions = (req as any).userPermissions;
  
  // RBAC Check: Block anyone without the create permission
  if (!permissions.includes('user:create')) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to create users.' });
  }

  try {
    // Extract the data sent from the React form
    const { name, email, department, position, roleId } = req.body;

    // Save to PostgreSQL using Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        department,
        position,
        roleId: Number(roleId), // Ensure this is a number for Prisma
        status: 'ACTIVE'        // Default status for new hires
      },
      include: { role: true }   // Return the joined role data
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    // Throws an error (P2002) if a unique constraint (like email) fails
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});