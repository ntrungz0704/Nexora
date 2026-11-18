import 'dotenv/config';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Strictly synthetic non-PII development fixtures (ZERO TechPilot data/PII/secrets)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.demo@nexora.test' },
    update: {
      fullName: 'Nexora Demo Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin.demo@nexora.test',
      fullName: 'Nexora Demo Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff.demo@nexora.test' },
    update: {
      fullName: 'Nexora Demo Staff',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'staff.demo@nexora.test',
      fullName: 'Nexora Demo Staff',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer.demo@nexora.test' },
    update: {
      fullName: 'Nexora Demo Customer',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'customer.demo@nexora.test',
      fullName: 'Nexora Demo Customer',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  const defaultSettings = [
    {
      settingKey: 'store.name',
      settingValue: 'Nexora Tech Store',
      description: 'Official single-vendor store display name',
    },
    {
      settingKey: 'store.business_model',
      settingValue: 'single-vendor',
      description: 'Locked Nexora architecture business model',
    },
    {
      settingKey: 'store.currency',
      settingValue: 'VND',
      description: 'Primary store transaction currency',
    },
  ];

  for (const item of defaultSettings) {
    await prisma.storeSetting.upsert({
      where: { settingKey: item.settingKey },
      update: {
        settingValue: item.settingValue,
        description: item.description,
      },
      create: item,
    });
  }

  const existingSeedAudit = await prisma.auditLog.findFirst({
    where: {
      action: 'FOUNDATION_SEED_COMPLETED',
      entityType: 'StoreSetting',
    },
  });

  if (!existingSeedAudit) {
    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'FOUNDATION_SEED_COMPLETED',
        entityType: 'StoreSetting',
        entityId: 'baseline',
        metadata: {
          seededUsers: 3,
          seededSettings: defaultSettings.length,
        },
      },
    });
  }

  console.log('Nexora synthetic foundation seed completed.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
