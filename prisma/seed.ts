import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleName } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const roleNames = [
  RoleName.STUDENT,
  RoleName.STAFF,
  RoleName.ADMIN,
] as const;

const categoryNames = ["Bags", "Electronics", "Documents", "Keys", "Clothing", "Others"] as const;

async function main() {
  const roles = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log("Seeded roles: STUDENT, STAFF, ADMIN");

  await Promise.all(
    categoryNames.map((name) =>
      prisma.itemCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log("Seeded categories:", categoryNames.join(", "));

  const studentRole = roles.find((role) => role.name === RoleName.STUDENT)!;
  const staffRole = roles.find((role) => role.name === RoleName.STAFF)!;
  const adminRole = roles.find((role) => role.name === RoleName.ADMIN)!;

  const studentUser = await prisma.user.upsert({
    where: { email: "demo.student@au.edu" },
    update: {},
    create: {
      email: "demo.student@au.edu",
      displayName: "Demo Student",
      roleId: studentRole.id,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "demo.staff@au.edu" },
    update: {},
    create: {
      email: "demo.staff@au.edu",
      displayName: "Demo Staff",
      roleId: staffRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo.admin@au.edu" },
    update: {},
    create: {
      email: "demo.admin@au.edu",
      displayName: "Demo Admin",
      roleId: adminRole.id,
    },
  });

  console.log("Seeded demo users: demo.student@au.edu, demo.staff@au.edu, demo.admin@au.edu");

  const categories = await prisma.itemCategory.findMany();
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  async function upsertReport(data: {
    title: string;
    description: string;
    reportType: "LOST" | "FOUND";
    location: string;
    occurredAt: Date;
    color?: string;
    brand?: string;
    categoryName: (typeof categoryNames)[number];
    createdById: string;
  }) {
    const existing = await prisma.itemReport.findFirst({
      where: { title: data.title, reportType: data.reportType, createdById: data.createdById },
    });
    if (existing) return existing;

    return prisma.itemReport.create({
      data: {
        title: data.title,
        description: data.description,
        reportType: data.reportType,
        location: data.location,
        occurredAt: data.occurredAt,
        color: data.color,
        brand: data.brand,
        categoryId: categoryByName[data.categoryName],
        createdById: data.createdById,
      },
    });
  }

  await upsertReport({
    title: "Black Wallet",
    description: "Black leather wallet with a small scratch on the front",
    reportType: "LOST",
    location: "Library 2nd Floor",
    occurredAt: new Date("2026-08-15T10:00:00Z"),
    color: "Black",
    brand: "Nike",
    categoryName: "Bags",
    createdById: studentUser.id,
  });

  await upsertReport({
    title: "Black Wallet",
    description: "Leather wallet found near the entrance",
    reportType: "FOUND",
    location: "Student Center",
    occurredAt: new Date("2026-08-16T09:00:00Z"),
    color: "Dark Black",
    categoryName: "Bags",
    createdById: staffUser.id,
  });

  await upsertReport({
    title: "AirPods Case",
    description: "White AirPods case with a small scratch on the lid",
    reportType: "LOST",
    location: "Cafeteria",
    occurredAt: new Date("2026-08-17T12:00:00Z"),
    color: "White",
    brand: "Apple",
    categoryName: "Electronics",
    createdById: studentUser.id,
  });

  await upsertReport({
    title: "AirPods Case",
    description: "White AirPods case, scratch on the lid",
    reportType: "FOUND",
    location: "Cafeteria",
    occurredAt: new Date("2026-08-17T13:00:00Z"),
    color: "White",
    brand: "Apple",
    categoryName: "Electronics",
    createdById: staffUser.id,
  });

  await upsertReport({
    title: "Blue Umbrella",
    description: "Blue umbrella with a wooden handle, missing one rib",
    reportType: "LOST",
    location: "Gymnasium",
    occurredAt: new Date("2026-08-10T08:00:00Z"),
    color: "Blue",
    categoryName: "Others",
    createdById: studentUser.id,
  });

  await upsertReport({
    title: "Student ID Card",
    description: "AU student ID card found on the ground near the entrance",
    reportType: "FOUND",
    location: "ABAC Building",
    occurredAt: new Date("2026-08-18T09:00:00Z"),
    categoryName: "Documents",
    createdById: staffUser.id,
  });

  console.log("Seeded sample lost/found item reports.");
}

main()
  .catch((error: unknown) => {
    console.error("Role seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
