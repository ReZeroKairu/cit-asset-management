import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding with current data...');

  // Clean up existing data
  await prisma.inventory_assets.deleteMany();
  await prisma.workstations.deleteMany();
  await prisma.users.deleteMany();
  await prisma.laboratories.deleteMany();
  await prisma.units.deleteMany();
  await prisma.device_types.deleteMany();
  await prisma.departments.deleteMany();
  await prisma.office_types.deleteMany();
  await prisma.campuses.deleteMany();
  await prisma.procedures.deleteMany();
  await prisma.procedure_checklists.deleteMany();
  await prisma.daily_reports.deleteMany();

  // Import your current data here
  // This is a template - you would replace with your actual exported data
  
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const custodianPassword = await bcrypt.hash('custodian123', 10);

  // Create campuses
  const campuses = await Promise.all([
    prisma.campuses.create({ data: { campus_name: 'Main Campus' } }),
    prisma.campuses.create({ data: { campus_name: 'Paseo Campus' } }),
    prisma.campuses.create({ data: { campus_name: 'RNP Campus' } }),
  ]);

  // Create office types
  const officeTypes = await Promise.all([
    prisma.office_types.create({ data: { type_name: 'ACADEMIC' } }),
    prisma.office_types.create({ data: { type_name: 'SUPPORT SERVICE' } }),
    prisma.office_types.create({ data: { type_name: 'ADMINISTRATIVE' } }),
  ]);

  // Create departments
  const departments = await Promise.all([
    prisma.departments.create({ 
      data: { 
        dept_name: 'College of Information Technology', 
        campus_id: campuses[0].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'Dean IT'
      } 
    }),
    prisma.departments.create({ 
      data: { 
        dept_name: 'College of Pharmacy', 
        campus_id: campuses[1].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'Dean Pharmacy'
      } 
    }),
    prisma.departments.create({ 
      data: { 
        dept_name: 'Junior High School', 
        campus_id: campuses[2].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'JHS Principal'
      } 
    }),
    prisma.departments.create({ 
      data: { 
        dept_name: 'Senior High School', 
        campus_id: campuses[0].campus_id, 
        office_type_id: officeTypes[0].type_id,
        designee_name: 'SHS Principal'
      } 
    }),
  ]);

  // Create device types
  const deviceTypes = await Promise.all([
    prisma.device_types.create({ data: { device_type_name: 'PC Devices' } }),
    prisma.device_types.create({ data: { device_type_name: 'Network Devices' } }),
    prisma.device_types.create({ data: { device_type_name: 'Other Devices' } }),
  ]);

  // Create users
  const users = await Promise.all([
    prisma.users.create({ 
      data: { 
        full_name: 'CIT Administrator', 
        email: 'admin@cit.edu', 
        password_hash: adminPassword,
        role: 'Admin'
      } 
    }),
    prisma.users.create({ 
      data: { 
        full_name: 'Jes Masuangat', 
        email: 'jes@cit.edu', 
        password_hash: custodianPassword,
        role: 'Custodian'
      } 
    }),
    prisma.users.create({ 
      data: { 
        full_name: 'Kyle Rana', 
        email: 'kyle@cit.edu', 
        password_hash: custodianPassword,
        role: 'Custodian'
      } 
    }),
    prisma.users.create({ 
      data: { 
        full_name: 'Jun Brian', 
        email: 'jun@cit.edu', 
        password_hash: adminPassword,
        role: 'Admin'
      } 
    }),
  ]);

  // Create laboratories
  const laboratories = await Promise.all([
    prisma.laboratories.create({ 
      data: { 
        lab_name: 'CIT-Lab 1', 
        location: 'WAC Building 3rd Floor', 
        dept_id: departments[0].dept_id,
        in_charge_id: users[3].user_id
      } 
    }),
    prisma.laboratories.create({ 
      data: { 
        lab_name: 'CIT-Lab 2', 
        location: 'WAC Building 3rd Floor', 
        dept_id: departments[0].dept_id,
        in_charge_id: users[1].user_id
      } 
    }),
    prisma.laboratories.create({ 
      data: { 
        lab_name: 'CIT-CISCO Lab', 
        location: 'WAC Building 2nd Floor', 
        dept_id: departments[0].dept_id
      } 
    }),
  ]);

  // Update users with lab assignments
  await Promise.all([
    prisma.users.update({ 
      where: { user_id: users[1].user_id }, 
      data: { lab_id: laboratories[1].lab_id } 
    }),
    prisma.users.update({ 
      where: { user_id: users[3].user_id }, 
      data: { lab_id: laboratories[0].lab_id } 
    }),
  ]);

  console.log('Seeding finished.');
  console.log('Created:');
  console.log(`- ${campuses.length} campuses`);
  console.log(`- ${departments.length} departments`);
  console.log(`- ${users.length} users`);
  console.log(`- ${laboratories.length} laboratories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
