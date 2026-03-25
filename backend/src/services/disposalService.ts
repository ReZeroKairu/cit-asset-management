import { prisma } from "../initDatabase";
import { DisposalData, DisposalFilters } from "../types/disposal";

export class DisposalService {
  // CREATE Disposal Record
  static async createDisposal(disposalData: DisposalData) {
    try {
      // Get current asset with workstation, lab, and asset details
      const asset = await prisma.inventory_assets.findUnique({
        where: { asset_id: disposalData.asset_id },
        include: {
          workstations: {
            select: { workstation_name: true }
          },
          laboratories: {
            select: { lab_name: true }
          },
          asset_details: {
            select: { 
              property_tag_no: true,
              description: true,
              serial_number: true,
              date_of_purchase: true,
              quantity: true
            }
          }
        }
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      // Create disposal record using raw SQL (since Prisma client has issues)
      const disposal = await prisma.$queryRaw`
        INSERT INTO asset_disposals (
          asset_id, workstation_id, workstation_name, lab_id, lab_name,
          disposal_date, disposal_reason, disposal_method, disposal_value,
          approved_by, disposed_by, disposal_document, disposal_remarks,
          property_tag_no, asset_description, serial_number, date_of_purchase, quantity
        ) VALUES (
          ${disposalData.asset_id},
          ${asset.workstation_id},
          ${asset.workstations?.workstation_name || 'Unassigned'},
          ${asset.lab_id},
          ${asset.laboratories?.lab_name || 'Unassigned'},
          ${new Date(disposalData.disposal_date)},
          ${disposalData.disposal_reason},
          ${disposalData.disposal_method},
          ${disposalData.disposal_value ? Number(disposalData.disposal_value) : null},
          ${disposalData.approved_by},
          ${disposalData.disposed_by},
          ${disposalData.disposal_document},
          ${disposalData.disposal_remarks},
          ${asset.asset_details?.property_tag_no},
          ${asset.asset_details?.description},
          ${asset.asset_details?.serial_number},
          ${asset.asset_details?.date_of_purchase},
          ${asset.asset_details?.quantity || 1}
        )
      `;

      // DELETE asset from inventory (complete move, no duplication)
      await prisma.inventory_assets.delete({
        where: { asset_id: disposalData.asset_id }
      });

      // Also delete asset_details since we moved them to disposal
      if (asset.asset_details) {
        await prisma.asset_details.delete({
          where: { asset_id: disposalData.asset_id }
        });
      }

      return { success: true, message: "Disposal created successfully" };
    } catch (error) {
      console.error("Error creating disposal:", error);
      throw error;
    }
  }

  // GET All Disposals (with filtering)
  static async getAllDisposals(filters?: DisposalFilters) {
    try {
      let whereClause = "";
      
      if (filters?.disposal_method) {
        whereClause += ` AND disposal_method = '${filters.disposal_method}'`;
      }

      if (filters?.date_from) {
        whereClause += ` AND disposal_date >= '${filters.date_from}'`;
      }

      if (filters?.date_to) {
        whereClause += ` AND disposal_date <= '${filters.date_to}'`;
      }

      if (filters?.workstation_name) {
        whereClause += ` AND workstation_name LIKE '%${filters.workstation_name}%'`;
      }

      if (filters?.lab_name) {
        whereClause += ` AND lab_name LIKE '%${filters.lab_name}%'`;
      }

      const disposals = await prisma.$queryRaw`
        SELECT * FROM asset_disposals 
        WHERE 1=1 ${whereClause}
        ORDER BY disposal_date DESC
      `;

      return disposals;
    } catch (error) {
      console.error("Error fetching disposals:", error);
      throw error;
    }
  }

  // GET Single Disposal
  static async getDisposalById(disposalId: number) {
    try {
      const disposal = await prisma.$queryRaw`
        SELECT * FROM asset_disposals 
        WHERE disposal_id = ${disposalId}
        LIMIT 1
      `;

      return (disposal as any[])[0] || null;
    } catch (error) {
      console.error("Error fetching disposal:", error);
      throw error;
    }
  }

  // UPDATE Disposal
  static async updateDisposal(disposalId: number, updateData: Partial<DisposalData>) {
    try {
      let setClause = "";
      
      if (updateData.disposal_date) {
        setClause += `disposal_date = '${new Date(updateData.disposal_date)}', `;
      }
      
      if (updateData.disposal_reason) {
        setClause += `disposal_reason = '${updateData.disposal_reason}', `;
      }
      
      if (updateData.disposal_method) {
        setClause += `disposal_method = '${updateData.disposal_method}', `;
      }
      
      if (updateData.disposal_value !== undefined) {
        setClause += `disposal_value = ${updateData.disposal_value ? Number(updateData.disposal_value) : null}, `;
      }
      
      if (updateData.approved_by) {
        setClause += `approved_by = ${updateData.approved_by}, `;
      }
      
      if (updateData.disposed_by) {
        setClause += `disposed_by = ${updateData.disposed_by}, `;
      }
      
      if (updateData.disposal_document !== undefined) {
        setClause += `disposal_document = ${updateData.disposal_document ? `'${updateData.disposal_document}'` : null}, `;
      }
      
      if (updateData.disposal_remarks !== undefined) {
        setClause += `disposal_remarks = ${updateData.disposal_remarks ? `'${updateData.disposal_remarks}'` : null}, `;
      }

      // Remove trailing comma
      setClause = setClause.replace(/,\s*$/, '');

      const disposal = await prisma.$queryRaw`
        UPDATE asset_disposals 
        SET ${setClause}
        WHERE disposal_id = ${disposalId}
      `;

      return { success: true, message: "Disposal updated successfully" };
    } catch (error) {
      console.error("Error updating disposal:", error);
      throw error;
    }
  }

  // DELETE Disposal (and restore asset if needed)
  static async deleteDisposal(disposalId: number, restoreAsset: boolean = false) {
    try {
      // Get disposal record before deletion
      const disposal = await prisma.$queryRaw`
        SELECT * FROM asset_disposals 
        WHERE disposal_id = ${disposalId}
        LIMIT 1
      `;

      if (!disposal) {
        throw new Error("Disposal not found");
      }

      const disposalRecord = (disposal as any[])[0];

      // If restoreAsset is true, restore the asset to inventory
      if (restoreAsset) {
        // Recreate asset in inventory_assets from disposal record
        await prisma.inventory_assets.create({
          data: {
            asset_id: disposalRecord.asset_id,
            lab_id: disposalRecord.lab_id,
            workstation_id: disposalRecord.workstation_id,
            unit_id: null, // Not preserved in disposal
            added_by_user_id: disposalRecord.disposed_by, // Use disposer as adder
            date_added: new Date(),
          }
        });

        // Recreate asset_details if available
        if (disposalRecord.property_tag_no || disposalRecord.asset_description || disposalRecord.serial_number) {
          await prisma.asset_details.create({
            data: {
              asset_id: disposalRecord.asset_id,
              property_tag_no: disposalRecord.property_tag_no,
              description: disposalRecord.asset_description,
              serial_number: disposalRecord.serial_number,
              date_of_purchase: disposalRecord.date_of_purchase,
              quantity: disposalRecord.quantity || 1,
              asset_remarks: null,
              status_id: 1, // Default active status
            }
          });
        }
      }

      await prisma.$queryRaw`
        DELETE FROM asset_disposals 
        WHERE disposal_id = ${disposalId}
      `;

      return { message: "Disposal deleted successfully", restored: restoreAsset };
    } catch (error) {
      console.error("Error deleting disposal:", error);
      throw error;
    }
  }

  // GET Disposal Statistics
  static async getDisposalStatistics() {
    try {
      const [
        totalDisposals,
        disposalsByMethod,
        disposalsByMonth,
        totalValue
      ] = await Promise.all([
        // Total disposals
        prisma.$queryRaw`SELECT COUNT(*) as count FROM asset_disposals`,
        
        // Disposals by method
        prisma.$queryRaw`
          SELECT 
            disposal_method,
            COUNT(*) as _count
          FROM asset_disposals 
          GROUP BY disposal_method
        `,
        
        // Disposals by month (last 12 months)
        prisma.$queryRaw`
          SELECT 
            DATE_FORMAT(disposal_date, '%Y-%m') as month,
            COUNT(*) as count
          FROM asset_disposals 
          WHERE disposal_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(disposal_date, '%Y-%m')
          ORDER BY month DESC
        `,
        
        // Total disposal value
        prisma.$queryRaw`
          SELECT SUM(disposal_value) as total
          FROM asset_disposals
        `
      ]);

      return {
        totalDisposals: (totalDisposals as any[])[0]?.count || 0,
        disposalsByMethod: disposalsByMethod as any[],
        disposalsByMonth: disposalsByMonth as any[],
        totalValue: (totalValue as any[])[0]?.total || 0
      };
    } catch (error) {
      console.error("Error fetching disposal statistics:", error);
      throw error;
    }
  }

  // GET Assets Available for Disposal
  static async getAvailableAssetsForDisposal() {
    try {
      // Get all assets that haven't been disposed
      const disposedAssetIds = await prisma.$queryRaw`
        SELECT asset_id FROM asset_disposals
      `;
      
      const disposedIds = (disposedAssetIds as any[]).map(d => d.asset_id);
      
      let assets;
      if (disposedIds.length > 0) {
        assets = await prisma.$queryRaw`
          SELECT 
            ia.asset_id,
            ia.lab_id,
            ia.workstation_id,
            ia.unit_id,
            ia.added_by_user_id,
            ia.date_added,
            ad.property_tag_no,
            ad.description,
            ad.serial_number,
            ad.date_of_purchase,
            ad.quantity,
            ws.workstation_name,
            l.lab_name,
            u.unit_name
          FROM inventory_assets ia
          LEFT JOIN asset_details ad ON ia.asset_id = ad.asset_id
          LEFT JOIN workstations ws ON ia.workstation_id = ws.workstation_id
          LEFT JOIN laboratories l ON ia.lab_id = l.lab_id
          LEFT JOIN units u ON ia.unit_id = u.unit_id
          WHERE ia.asset_id NOT IN (${disposedIds.join(',')})
          ORDER BY ia.asset_id
        `;
      } else {
        assets = await prisma.$queryRaw`
          SELECT 
            ia.asset_id,
            ia.lab_id,
            ia.workstation_id,
            ia.unit_id,
            ia.added_by_user_id,
            ia.date_added,
            ad.property_tag_no,
            ad.description,
            ad.serial_number,
            ad.date_of_purchase,
            ad.quantity,
            ws.workstation_name,
            l.lab_name,
            u.unit_name
          FROM inventory_assets ia
          LEFT JOIN asset_details ad ON ia.asset_id = ad.asset_id
          LEFT JOIN workstations ws ON ia.workstation_id = ws.workstation_id
          LEFT JOIN laboratories l ON ia.lab_id = l.lab_id
          LEFT JOIN units u ON ia.unit_id = u.unit_id
          ORDER BY ia.asset_id
        `;
      }

      return assets;
    } catch (error) {
      console.error("Error fetching available assets:", error);
      throw error;
    }
  }
}
