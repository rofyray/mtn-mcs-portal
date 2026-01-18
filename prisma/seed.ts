import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coordinators = [
  {
    name: "Lydia Ohenewaa",
    email: "Lydia.Ohenewaa@mtn.com",
    role: "COORDINATOR",
    regions: ["A"],
  },
  {
    name: "Mariam Abubakar",
    email: "Mariam.Abubakar@mtn.com",
    role: "COORDINATOR",
    regions: ["N", "U", "X", "S", "J", "B", "F", "H"],
  },
  {
    name: "Jeremiah Agyei",
    email: "Jeremiah.Adjei@mtn.com",
    role: "COORDINATOR",
    regions: ["E", "V", "O"],
  },
  {
    name: "Kwame Nkrumah",
    email: "lynxcorp.org@gmail.com",
    role: "COORDINATOR",
    regions: ["E", "V", "O"],
  },
  {
    name: "Muniratu Iddi-Abass Hussein",
    email: "Muniratu.Iddi-AbassHussein@mtn.com",
    role: "COORDINATOR",
    regions: ["G"],
  },
  {
    name: "Dennis Kwame",
    email: "Dennis.Kwame@mtn.com",
    role: "COORDINATOR",
    regions: ["G"],
  },
  {
    name: "Lovelace Mensah",
    email: "Lovelace.Mensah@mtn.com",
    role: "COORDINATOR",
    regions: ["W", "C", "R"],
  },
  {
    name: "Paa Grant",
    email: "geoffreyokyereforson@gmail.com",
    role: "COORDINATOR",
    regions: ["W", "C", "R", "G"],
  },
];

const fullAccessAdmins = [
  {
    name: "Geoffrey Okyere-Forson",
    email: "geoffery.okyere-forson@mtn.com",
    role: "FULL",
    regions: [],
  },
  {
    name: "Enyonam Avevor",
    email: "Enyonam.Avevor@mtn.com",
    role: "FULL",
    regions: [],
  },
  {
    name: "System Admin",
    email: "mtnadmin@grr.la",
    role: "FULL",
    regions: [],
  },
];

async function main() {
  const admins = [...coordinators, ...fullAccessAdmins];

  for (const admin of admins) {
    const record = await prisma.admin.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        role: admin.role as "COORDINATOR" | "FULL",
      },
      create: {
        name: admin.name,
        email: admin.email,
        role: admin.role as "COORDINATOR" | "FULL",
      },
    });

    if (admin.role === "COORDINATOR") {
      for (const region of admin.regions) {
        await prisma.adminRegionAssignment.upsert({
          where: {
            adminId_regionCode: {
              adminId: record.id,
              regionCode: region,
            },
          },
          update: {},
          create: {
            adminId: record.id,
            regionCode: region,
          },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
