import { Request, Response } from "express";
import * as ExtrasService from "../services/inventoryExtrasService";

export const getLifecycleTimeline = async (req: Request, res: Response) => {
  try {
    const data = await ExtrasService.getLifecycleTimeline(
      req.query.lab_id ? Number(req.query.lab_id) : undefined,
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch asset lifecycle timeline" });
  }
};

export const getLifecycleSummary = async (req: Request, res: Response) => {
  try {
    const data = await ExtrasService.getLifecycleSummary(
      req.query.lab_id ? Number(req.query.lab_id) : undefined,
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch asset lifecycle summary" });
  }
};

export const getUnits = async (req: Request, res: Response) => {
  try {
    const units = await ExtrasService.getUnits(
      req.query.device_type_id ? Number(req.query.device_type_id) : undefined,
    );
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
};

export const createUnit = async (req: Request, res: Response) => {
  try {
    const { unit_name, device_type_id } = req.body;
    if (!unit_name || !device_type_id)
      return res
        .status(400)
        .json({ error: "Unit name and device type are required" });
    const newUnit = await ExtrasService.createUnit(
      unit_name,
      Number(device_type_id),
    );
    res.status(201).json(newUnit);
  } catch (error: any) {
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to create unit" });
  }
};

export const getDeviceTypes = async (req: Request, res: Response) => {
  try {
    res.json(await ExtrasService.getDeviceTypes());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch device types" });
  }
};

export const resolveWorkstation = async (req: Request, res: Response) => {
  try {
    const { lab_id, workstation_name } = req.query;
    if (!lab_id || !workstation_name)
      return res
        .status(400)
        .json({ error: "lab_id and workstation_name are required" });
    const result = await ExtrasService.resolveWorkstation(
      Number(lab_id),
      String(workstation_name),
    );
    res.json(result);
  } catch (error: any) {
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Failed to resolve workstation" });
  }
};
