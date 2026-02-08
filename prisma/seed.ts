import { PrismaClient, AdminRole } from "@prisma/client";

const prisma = new PrismaClient();

const coordinators = [
  {
    name: "Lydia Ohenewaa",
    email: "lydia.ohenewaa@mtn.com",
    role: "COORDINATOR",
    regions: [{ code: "A" }],
  },
  {
    name: "System Coordinator",
    email: "regionadmin@grr.la",
    role: "COORDINATOR",
    regions: [{ code: "G" }, { code: "A" }],
  },
  {
    name: "Mariam Abubakar",
    email: "mariam.abubakar@mtn.com",
    role: "COORDINATOR",
    regions: [{ code: "N" }, { code: "U" }, { code: "X" }, { code: "S" }, { code: "J" }, { code: "B" }, { code: "F" }, { code: "H" }],
  },
  {
    name: "Jeremiah Agyei",
    email: "jeremiah.adjei@mtn.com",
    role: "COORDINATOR",
    regions: [{ code: "E" }, { code: "V" }, { code: "O" }],
  },
  {
    name: "Kwame Nkrumah",
    email: "lynxcorp.org@gmail.com",
    role: "COORDINATOR",
    regions: [{ code: "E" }, { code: "V" }, { code: "O" }],
  },
  {
    name: "Muniratu Iddi-Abass Hussein",
    email: "muniratu.iddi-abasshussein@mtn.com",
    role: "COORDINATOR",
    regions: [{ code: "G", sbuCode: "ACCRA_EAST" }],
  },
  {
    name: "Dennis Kwame",
    email: "dennis.kwame@mtn.com",
    role: "COORDINATOR",
    regions: [{ code: "G", sbuCode: "ACCRA_WEST" }],
  },
  {
    name: "Lovelace Mensah",
    email: "lovelace.mensah@mtn.com",
    role: "COORDINATOR",
    regions: [{ code: "W" }, { code: "C" }, { code: "R" }],
  },
  {
    name: "Paa Grant",
    email: "geoffreyokyereforson@gmail.com",
    role: "COORDINATOR",
    regions: [{ code: "W" }, { code: "C" }, { code: "R" }, { code: "G" }],
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
    role: "GOVERNANCE",
    regions: [],
  },
];

const seniorManagers = [
  {
    name: "Janet Quarshie",
    email: "janet.quarshie@mtn.com",
    role: "SENIOR_MANAGER",
    regions: [{ code: "C" }, { code: "W" }, { code: "E" }, { code: "O" }, { code: "V" }, { code: "G" }, { code: "R" }],
  },
  {
    name: "Adwoa Baah Obeng",
    email: "adwoa.obeng@mtn.com",
    role: "SENIOR_MANAGER",
    regions: [{ code: "U" }, { code: "X" }, { code: "A" }, { code: "N" }, { code: "B" }, { code: "F" }, { code: "H" }, { code: "S" }, { code: "J" }],
  },
  {
    name: "System Senior Manager",
    email: "snrmgr@grr.la",
    role: "SENIOR_MANAGER",
    regions: [{ code: "A" }, { code: "B" }, { code: "C" }, { code: "E" }, { code: "F" }, { code: "G" }, { code: "H" }, { code: "J" }, { code: "N" }, { code: "O" }, { code: "R" }, { code: "S" }, { code: "U" }, { code: "V" }, { code: "W" }, { code: "X" }],
  },
  {
    name: "Okyere Forson",
    email: "okyereforsong@gmail.com",
    role: "SENIOR_MANAGER",
    regions: [{ code: "A" }, { code: "B" }, { code: "C" }, { code: "E" }, { code: "F" }, { code: "G" }, { code: "H" }, { code: "J" }, { code: "N" }, { code: "O" }, { code: "R" }, { code: "S" }, { code: "U" }, { code: "V" }, { code: "W" }, { code: "X" }],
  },
  {
    name: "Geoffrey Okyere-Forson",
    email: "geoffreyokyereforson05@gmail.com",
    role: "SENIOR_MANAGER",
    regions: [{ code: "C" }, { code: "W" }, { code: "E" }, { code: "O" }, { code: "V" }, { code: "G" }, { code: "R" }],
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
              regionCode: region.code,
            },
          },
          update: {
            sbuCode: ("sbuCode" in region ? region.sbuCode : null) as string | null,
          },
          create: {
            adminId: record.id,
            regionCode: region.code,
            sbuCode: ("sbuCode" in region ? region.sbuCode : null) as string | null,
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
