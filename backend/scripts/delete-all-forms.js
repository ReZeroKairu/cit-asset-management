const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllForms() {
  try {
    console.log('⚠️  WARNING: This will delete ALL form submissions!');
    console.log('Type "DELETE ALL FORMS" to confirm:');
    
    // For automation, you can remove this confirmation step
    // const confirmation = require('readline-sync').question('Confirm: ');
    // if (confirmation !== 'DELETE ALL FORMS') {
    //   console.log('Operation cancelled.');
    //   return;
    // }

    console.log('Starting deletion of all form submissions...');

    // Delete all form submissions in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete lab requests
      const labRequestsDeleted = await tx.labRequests.deleteMany();
      console.log(`🗑️  Deleted ${labRequestsDeleted.count} lab requests`);

      // Delete equipment borrows
      const equipmentBorrowsDeleted = await tx.equipmentBorrows.deleteMany();
      console.log(`🗑️  Deleted ${equipmentBorrowsDeleted.count} equipment borrows`);

      // Delete software installations
      const softwareInstallationsDeleted = await tx.softwareInstallations.deleteMany();
      console.log(`🗑️  Deleted ${softwareInstallationsDeleted.count} software installations`);

      // Delete one-time form submissions
      const oneTimeFormsDeleted = await tx.oneTimeFormSubmissions.deleteMany();
      console.log(`🗑️  Deleted ${oneTimeFormsDeleted.count} one-time form submissions`);
    });

    console.log('✅ All form submissions have been deleted successfully!');

    // Verify deletion
    const labRequestsCount = await prisma.labRequests.count();
    const equipmentBorrowsCount = await prisma.equipmentBorrows.count();
    const softwareInstallationsCount = await prisma.softwareInstallations.count();
    const oneTimeFormsCount = await prisma.oneTimeFormSubmissions.count();

    console.log('\n📊 Verification - Remaining records:');
    console.log(`Lab Requests: ${labRequestsCount}`);
    console.log(`Equipment Borrows: ${equipmentBorrowsCount}`);
    console.log(`Software Installations: ${softwareInstallationsCount}`);
    console.log(`One-Time Forms: ${oneTimeFormsCount}`);

  } catch (error) {
    console.error('❌ Error deleting forms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
deleteAllForms();
