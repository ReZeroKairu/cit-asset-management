import { Request, Response } from "express";
import * as InventoryService from "../services/inventoryService";

export const getInventory = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userLabId = req.user?.lab_id;
    const filters = {
      lab_id: req.query.lab_id ? Number(req.query.lab_id) : undefined,
      workstation_id: req.query.workstation_id
        ? Number(req.query.workstation_id)
        : undefined,
    };

    const assets = await InventoryService.getInventory(
      userRole,
      userLabId,
      filters,
    );
    res.json(assets);
  } catch (error: any) {
    console.error("Error fetching inventory:", error);
    res.status(error.message.includes("FORBIDDEN") ? 403 : 500).json({
      error: error.message || "Failed to fetch assets",
    });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const newAsset = await InventoryService.createAsset(req.body, userId);
    res.status(201).json(newAsset);
  } catch (error: any) {
    console.error("Error creating asset:", error);
    res.status(500).json({
      error: "Failed to create asset",
      details: error.message || "Unknown error",
    });
  }
};

export const batchCreateAssets = async (req: Request, res: Response) => {
  try {
    const { assets } = req.body;
    const userId = req.user?.userId;

    const createdAssets = await InventoryService.batchCreateAssets(
      assets,
      userId,
    );

    res.status(201).json({
      message: `Successfully created ${createdAssets.length} assets`,
      assets: createdAssets,
    });
  } catch (error: any) {
    console.error("Batch Create Error:", error);
    res
      .status(400)
      .json({ error: "Failed to create assets", details: error.message });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    if (isNaN(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const updatedAsset = await InventoryService.updateAsset(assetId, req.body);
    res.json(updatedAsset);
  } catch (error: any) {
    console.error("Backend: ERROR in updateAsset:", error);
    res.status(500).json({
      error: "Failed to update asset",
      details: error.message,
    });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    if (isNaN(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const result = await InventoryService.deleteAsset(assetId);
    res.json(result);
  } catch (error: any) {
    console.error("Error deleting asset:", error);
    if (error.message.includes("NOT_FOUND")) {
      return res.status(404).json({ error: "Asset not found" });
    }
    // Handle foreign key or other generic errors
    res.status(500).json({
      error: "Failed to delete asset",
      details: error.message,
    });
  }
};

export const getAssetStatuses = async (req: Request, res: Response) => {
  try {
    const statuses = await InventoryService.getAssetStatuses();
    res.json(statuses);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch asset statuses" });
  }
};
