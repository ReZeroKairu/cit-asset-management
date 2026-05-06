import { Request, Response } from "express";
import * as LabService from "../services/labService";

export const getLaboratories = async (req: Request, res: Response) => {
  try {
    const laboratories = await LabService.getLaboratories();
    res.json(laboratories);
  } catch (error: any) {
    console.error("Error fetching laboratories:", error);
    res.status(500).json({ error: "Failed to fetch laboratories" });
  }
};

export const createLaboratory = async (req: Request, res: Response) => {
  try {
    const newLab = await LabService.createLaboratory(req.body);
    res.status(201).json(newLab);
  } catch (error: any) {
    console.error("Error creating laboratory:", error);
    if (
      error.message.includes("VALIDATION") ||
      error.message.includes("DUPLICATE")
    ) {
      return res.status(400).json({
        error: error.message.replace(/VALIDATION:|DUPLICATE:/, "").trim(),
      });
    }
    res.status(500).json({ error: "Failed to create laboratory" });
  }
};

export const updateLaboratory = async (req: Request, res: Response) => {
  try {
    const labId = parseInt(req.params.id as string);
    if (isNaN(labId))
      return res.status(400).json({ error: "Laboratory ID is required" });

    const updatedLab = await LabService.updateLaboratory(labId, req.body);
    res.json(updatedLab);
  } catch (error: any) {
    console.error("Error updating laboratory:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Laboratory not found" });
    if (error.message.includes("DUPLICATE"))
      return res
        .status(400)
        .json({ error: "Laboratory with this name already exists" });
    res.status(500).json({ error: "Failed to update laboratory" });
  }
};

export const deleteLaboratory = async (req: Request, res: Response) => {
  try {
    const labId = parseInt(req.params.id as string);
    if (isNaN(labId))
      return res.status(400).json({ error: "Laboratory ID is required" });

    const result = await LabService.deleteLaboratory(labId);
    res.json(result);
  } catch (error: any) {
    console.error("Error deleting laboratory:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Laboratory not found" });
    if (error.message.includes("VALIDATION"))
      return res
        .status(400)
        .json({ error: error.message.replace("VALIDATION:", "").trim() });
    res.status(500).json({ error: "Failed to delete laboratory" });
  }
};

export const getLaboratoryById = async (req: Request, res: Response) => {
  try {
    const identifier = req.params.id ?? (req.params as any).labName;
    if (!identifier)
      return res
        .status(400)
        .json({ error: "Laboratory identifier is required" });

    const laboratory = await LabService.getLaboratoryDetails(
      identifier as string,
    );
    res.json(laboratory);
  } catch (error: any) {
    console.error("Error fetching laboratory:", error);
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: "Laboratory not found" });
    res.status(500).json({ error: "Failed to fetch laboratory" });
  }
};
