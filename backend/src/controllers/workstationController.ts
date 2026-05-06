import { Request, Response } from "express";
import * as WorkstationService from "../services/workstationService";

export const getAllWorkstations = async (req: Request, res: Response) => {
  try {
    const workstations = await WorkstationService.getAllWorkstations(
      req.user?.role,
      req.user?.lab_id,
    );
    res.json(workstations);
  } catch (error: any) {
    console.error("Error fetching workstations:", error);
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};

export const createWorkstation = async (req: Request, res: Response) => {
  try {
    const newWorkstation = await WorkstationService.createWorkstation(req.body);
    res.status(201).json(newWorkstation);
  } catch (error: any) {
    console.error("Error creating workstation:", error);
    res
      .status(error.message.includes("VALIDATION") ? 400 : 500)
      .json({ error: error.message || "Failed to create workstation" });
  }
};

export const getWorkstationDetails = async (req: Request, res: Response) => {
  try {
    const workstation = await WorkstationService.getWorkstationDetails(
      req.params.name as string,
    );
    res.json(workstation);
  } catch (error: any) {
    console.error("Error fetching workstation details:", error);
    res
      .status(error.message.includes("NOT_FOUND") ? 404 : 500)
      .json({ error: error.message || "Failed to fetch workstation details" });
  }
};

export const updateWorkstation = async (req: Request, res: Response) => {
  try {
    const workstationId = parseInt(req.params.id as string);
    if (isNaN(workstationId))
      return res.status(400).json({ error: "Workstation ID is required" });

    const updatedWorkstation = await WorkstationService.updateWorkstation(
      workstationId,
      req.body,
    );
    res.json(updatedWorkstation);
  } catch (error: any) {
    console.error("Error updating workstation:", error);
    res
      .status(error.message.includes("NOT_FOUND") ? 404 : 500)
      .json({ error: error.message || "Failed to update workstation" });
  }
};

export const deleteWorkstation = async (req: Request, res: Response) => {
  try {
    const workstationId = parseInt(req.params.id as string);
    if (isNaN(workstationId))
      return res.status(400).json({ error: "Workstation ID is required" });

    const result = await WorkstationService.deleteWorkstation(workstationId);
    res.json(result);
  } catch (error: any) {
    console.error("Error deleting workstation:", error);
    res
      .status(error.message.includes("NOT_FOUND") ? 404 : 500)
      .json({ error: error.message || "Failed to delete workstation" });
  }
};

export const batchCreateWorkstations = async (req: Request, res: Response) => {
  try {
    const result = await WorkstationService.batchCreateWorkstations(
      req.body.workstations,
    );
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Batch create error:", error);
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ error: error.message });
    if (error.message.includes("DUPLICATE"))
      return res.status(409).json({ error: error.message });
    res
      .status(500)
      .json({ error: "Failed to create workstations", details: error.message });
  }
};

export const getWorkstationsByLab = async (req: Request, res: Response) => {
  try {
    const labId = parseInt(req.params.labId as string);
    if (isNaN(labId)) return res.status(400).json({ error: "Invalid Lab ID" });

    const workstations = await WorkstationService.getWorkstationsByLab(labId);
    res.json(workstations);
  } catch (error: any) {
    console.error("Error fetching lab workstations:", error);
    res.status(500).json({ error: "Failed to fetch workstations" });
  }
};
