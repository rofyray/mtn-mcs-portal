import { PrismaClient, AdminRole } from "@prisma/client";

const prisma = new PrismaClient();

const coordinators = [
  {
    name: "Lydia Ohenewaa",
    email: "lydia.ohenewaa@mtn.com",
    role: "COORDINATOR",
    regions: ["A"],
  },
  {
    name: "System Coordinator",
    email: "regionadmin@grr.la",
    role: "COORDINATOR",
    regions: ["G", "A"],
  },
  {
    name: "Mariam Abubakar",
    email: "mariam.abubakar@mtn.com",
    role: "COORDINATOR",
    regions: ["N", "U", "X", "S", "J", "B", "F", "H"],
  },
  {
    name: "Jeremiah Agyei",
    email: "jeremiah.adjei@mtn.com",
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
    email: "muniratu.iddi-abasshussein@mtn.com",
    role: "COORDINATOR",
    regions: ["G"],
  },
  {
    name: "Dennis Kwame",
    email: "dennis.kwame@mtn.com",
    role: "COORDINATOR",
    regions: ["G"],
  },
  {
    name: "Lovelace Mensah",
    email: "lovelace.mensah@mtn.com",
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
    name: "System Admin",
    email: "mtnadmin@grr.la",
    role: "FULL",
    regions: [],
  },
];

const managers = [
  {
    name: "Enyonam Avevor",
    email: "enyonam.avevor@mtn.com",
    role: "MANAGER",
    regions: [],
  },
];

const governanceCheckAdmins = [
  {
    name: "System Governance",
    email: "mtnlegal@grr.la",
    role: "GOVERNANCE_CHECK",
    regions: [],
  },
];

const seniorManagers = [
  {
    name: "Janet Quarshie",
    email: "janet.quarshie@mtn.com",
    role: "SENIOR_MANAGER",
    regions: ["C", "W", "E", "O", "V", "G", "R"],
  },
  {
    name: "Adwoa Baah Obeng",
    email: "adwoa.obeng@mtn.com",
    role: "SENIOR_MANAGER",
    regions: ["U", "X", "A", "N", "B", "F", "H", "S", "J"],
  },
  {
    name: "System Senior Manager",
    email: "snrmgr@grr.la",
    role: "SENIOR_MANAGER",
    regions: ["A", "B", "C", "E", "F", "G", "H", "J", "N", "O", "R", "S", "U", "V", "W", "X"],
  },
  {
    name: "Okyere Forson",
    email: "okyereforsong@gmail.com",
    role: "SENIOR_MANAGER",
    regions: ["A", "B", "C", "E", "F", "G", "H", "J", "N", "O", "R", "S", "U", "V", "W", "X"],
  },
  {
    name: "Geoffrey Okyere-Forson",
    email: "geoffreyokyereforson05@gmail.com",
    role: "SENIOR_MANAGER",
    regions: ["C", "W", "E", "O", "V", "G", "R"],
  },
];

async function main() {
  const admins = [...coordinators, ...fullAccessAdmins, ...managers, ...seniorManagers, ...governanceCheckAdmins];

  for (const admin of admins) {
    const normalizedEmail = admin.email.trim().toLowerCase();
    const record = await prisma.admin.upsert({
      where: { email: normalizedEmail },
      update: {
        name: admin.name,
        role: admin.role as AdminRole,
      },
      create: {
        name: admin.name,
        email: normalizedEmail,
        role: admin.role as AdminRole,
      },
    });

    if (admin.role === "COORDINATOR" || admin.role === "SENIOR_MANAGER") {
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
