import { Request, Response } from "express";
import { DisposalService } from "../services/disposalService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DisposalFilters {
  disposal_method?: string;
  date_from?: string;
  date_to?: string;
  workstation_name?: string;
  lab_name?: string;
}

// 1. CREATE Disposal Record
export const createDisposal = async (req: Request, res: Response) => {
  try {
    const disposalData = req.body;
    const disposal = await DisposalService.createDisposal(disposalData);
    res.status(201).json(disposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. GET All Disposals (with filtering)
export const getAllDisposals = async (req: Request, res: Response) => {
  try {
    console.log("🔍 getAllDisposals controller called");
    
    // First test: Check if we can connect to database at all
    try {
      const testQuery = `SELECT 1 as test`;
      await prisma.$queryRaw`${testQuery}`;
      console.log("✅ Database connection test passed");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Second test: Check if asset_disposals table exists
    try {
      const tableCheck = `SHOW TABLES LIKE 'asset_disposals'`;
      const tableResult = await prisma.$queryRaw`${tableCheck}`;
      console.log("✅ Table check result:", tableResult);
    } catch (tableError) {
      console.error("❌ Table check failed:", tableError);
      return res.status(500).json({ error: "Asset disposals table not found" });
    }

    const filters: DisposalFilters = {
      disposal_method: req.query.disposal_method as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      workstation_name: req.query.workstation_name as string,
      lab_name: req.query.lab_name as string,
    };
    
    console.log("🔍 Calling DisposalService.getAllDisposals with filters:", filters);
    const disposals = await DisposalService.getAllDisposals(filters);
    console.log("✅ Disposals retrieved successfully:", disposals);
    
    res.json({
      message: "Disposals retrieved successfully",
      data: disposals,
      count: Array.isArray(disposals) ? disposals.length : 0
    });
  } catch (error: any) {
    console.error("❌ Controller error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3. GET Single Disposal
export const getDisposalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const disposalId = Array.isArray(id) ? id[0] : id;
    const disposal = await DisposalService.getDisposalById(parseInt(disposalId));
    
    if (!disposal) {
      return res.status(404).json({ error: "Disposal not found" });
    }
    
    res.json(disposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. UPDATE Disposal
export const updateDisposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const disposalId = Array.isArray(id) ? id[0] : id;
    const updateData = req.body;
    
    const disposal = await DisposalService.updateDisposal(parseInt(disposalId), updateData);
    
    if (!disposal) {
      return res.status(404).json({ error: "Disposal not found" });
    }
    
    res.json(disposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. DELETE Disposal
export const deleteDisposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const disposalId = Array.isArray(id) ? id[0] : id;
    const restore = req.query.restore === "true";
    
    const result = await DisposalService.deleteDisposal(parseInt(disposalId), restore);
    
    if (!result) {
      return res.status(404).json({ error: "Disposal not found" });
    }
    
    res.json({ message: restore ? "Disposal restored successfully" : "Disposal deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. GET Disposal Statistics
export const getDisposalStatistics = async (req: Request, res: Response) => {
  try {
    const statistics = await DisposalService.getDisposalStatistics();
    res.json(statistics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. GET Assets Available for Disposal
export const getAvailableAssetsForDisposal = async (req: Request, res: Response) => {
  try {
    const assets = await DisposalService.getAvailableAssetsForDisposal();
    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
