const prisma = require('./prisma/client.js');

async function checkAssetStatuses() {
  const prismaClient = new prisma.PrismaClient();
  
  try {
    // Check unassigned assets
    const unassignedAssets = await prismaClient.inventory_assets.findMany({
      where: { workstation_id: null },
      select: {
        asset_id: true,
        workstation_id: true,
        asset_details: {
          select: {
            status_id: true,
            asset_statuses: {
              select: { status_name: true }
            }
          }
        }
      },
      take: 5
    });
    
    // Check lost assets
    const lostAssets = await prismaClient.inventory_assets.findMany({
      where: {
        asset_details: {
          status_id: 5 // Lost status
        }
      },
      select: {
        asset_id: true,
        workstation_id: true,
        asset_details: {
          select: {
            status_id: true,
            asset_statuses: {
              select: { status_name: true }
            }
          }
        }
      },
      take: 5
    });
    
    console.log('=== UNASSIGNED ASSETS ===');
    console.log(JSON.stringify(unassignedAssets, null, 2));
    
    console.log('\n=== LOST ASSETS ===');
    console.log(JSON.stringify(lostAssets, null, 2));
    
    // Check if unassigned assets have Lost status
    const unassignedWithLostStatus = unassignedAssets.filter(asset => 
      asset.asset_details?.status_id === 5
    );
    
    console.log('\n=== UNASSIGNED ASSETS WITH LOST STATUS ===');
    console.log(`Count: ${unassignedWithLostStatus.length}`);
    console.log(JSON.stringify(unassignedWithLostStatus, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

checkAssetStatuses();
