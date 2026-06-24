import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── 1. PERMISSIONS ──────────────────────────────────────────────
  const permissions = await Promise.all([
    prisma.permission.upsert({ where: { resource_action: { resource: 'user', action: 'read'       } }, update: {}, create: { resource: 'user', action: 'read',       label: 'View Users'        } }),
    prisma.permission.upsert({ where: { resource_action: { resource: 'user', action: 'create'     } }, update: {}, create: { resource: 'user', action: 'create',     label: 'Create Users'      } }),
    prisma.permission.upsert({ where: { resource_action: { resource: 'user', action: 'update'     } }, update: {}, create: { resource: 'user', action: 'update',     label: 'Edit Users'        } }),
    prisma.permission.upsert({ where: { resource_action: { resource: 'user', action: 'deactivate' } }, update: {}, create: { resource: 'user', action: 'deactivate', label: 'Deactivate Users'  } }),
    prisma.permission.upsert({ where: { resource_action: { resource: 'role', action: 'read'       } }, update: {}, create: { resource: 'role', action: 'read',       label: 'View Roles'        } }),
    prisma.permission.upsert({ where: { resource_action: { resource: 'role', action: 'assign'     } }, update: {}, create: { resource: 'role', action: 'assign',     label: 'Assign Roles'      } }),
  ]);

  const [pUserRead, pUserCreate, pUserUpdate, pUserDeactivate, pRoleRead, pRoleAssign] = permissions;

  // ── 2. ROLES ─────────────────────────────────────────────────────
  const admin = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full access to all resources',
      isSystem: true,
      permissions: {
        create: [
          { permission: { connect: { id: pUserRead!.id       } } },
          { permission: { connect: { id: pUserCreate!.id     } } },
          { permission: { connect: { id: pUserUpdate!.id     } } },
          { permission: { connect: { id: pUserDeactivate!.id } } },
          { permission: { connect: { id: pRoleRead!.id       } } },
          { permission: { connect: { id: pRoleAssign!.id     } } },
        ],
      },
    },
  });

  const manager = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Can manage users but cannot assign roles',
      isSystem: false,
      permissions: {
        create: [
          { permission: { connect: { id: pUserRead!.id       } } },
          { permission: { connect: { id: pUserCreate!.id     } } },
          { permission: { connect: { id: pUserUpdate!.id     } } },
          { permission: { connect: { id: pUserDeactivate!.id } } },
          { permission: { connect: { id: pRoleRead!.id       } } },
        ],
      },
    },
  });

  const viewer = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access',
      isSystem: false,
      permissions: {
        create: [
          { permission: { connect: { id: pUserRead!.id } } },
          { permission: { connect: { id: pRoleRead!.id } } },
        ],
      },
    },
  });

  // ── 3. USERS ─────────────────────────────────────────────────────
  const users = [
    // Admins
    { name: 'Alice Tan',    email: 'alice@example.com',   department: 'Engineering', position: 'System Administrator', status: 'ACTIVE'   as const, roleId: admin.id   },
    { name: 'Bob Lim',      email: 'bob@example.com',     department: 'IT',          position: 'IT Administrator',      status: 'ACTIVE'   as const, roleId: admin.id   },
    // Managers
    { name: 'Carol Wong',   email: 'carol@example.com',   department: 'HR',          position: 'HR Manager',            status: 'ACTIVE'   as const, roleId: manager.id },
    { name: 'David Ng',     email: 'david@example.com',   department: 'Finance',     position: 'Finance Manager',       status: 'PENDING'  as const, roleId: manager.id },
    { name: 'Eva Chen',     email: 'eva@example.com',     department: 'Operations',  position: 'Operations Manager',    status: 'INACTIVE' as const, roleId: manager.id },
    // Viewers
    { name: 'Frank Yeo',    email: 'frank@example.com',   department: 'Marketing',   position: 'Marketing Analyst',     status: 'ACTIVE'   as const, roleId: viewer.id  },
    { name: 'Grace Ho',     email: 'grace@example.com',   department: 'Engineering', position: 'Junior Developer',      status: 'PENDING'  as const, roleId: viewer.id  },
    { name: 'Henry Koh',    email: 'henry@example.com',   department: 'Finance',     position: 'Accounts Executive',    status: 'INACTIVE' as const, roleId: viewer.id  },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Seed complete: 3 roles, 6 permissions, 8 users inserted.');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
