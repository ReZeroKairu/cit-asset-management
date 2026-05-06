import { Request, Response } from "express";
import * as ComplaintService from "../services/complaintService";

const getClientIP = (req: Request) =>
  (req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.ip) as string;

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const complaint = await ComplaintService.createComplaint(
      req.body,
      getClientIP(req),
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Complaint submitted successfully",
        data: {
          complaint_id: complaint.complaint_id,
          status: complaint.status,
          created_at: complaint.created_at,
        },
      });
  } catch (error: any) {
    if (error.message.includes("CONFLICT"))
      return res
        .status(409)
        .json({
          message: error.message.replace("CONFLICT: ", ""),
          existingComplaintId: error.existingId,
        });
    if (error.message.includes("VALIDATION"))
      return res
        .status(400)
        .json({ message: error.message.replace("VALIDATION: ", "") });
    res
      .status(500)
      .json({ success: false, message: "Failed to submit complaint" });
  }
};

export const getPublicLaboratories = async (req: Request, res: Response) => {
  try {
    res.json(await ComplaintService.getLaboratoriesWithCustodian());
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch laboratories" });
  }
};

export const getLaboratories = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.getLaboratoriesWithCustodian(
        req.user?.role,
        req.user?.lab_id,
      ),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch laboratories" });
  }
};

export const getWorkstationsByLab = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.getWorkstationsByLab(
        Number(req.params.labId),
        req.user?.role,
        req.user?.lab_id,
      ),
    );
  } catch (error: any) {
    res
      .status(error.message.includes("FORBIDDEN") ? 403 : 500)
      .json({ message: error.message || "Failed to fetch workstations" });
  }
};

export const getAssetsByWorkstation = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.getAssetsByWorkstation(
        Number(req.params.workstationId),
      ),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assets" });
  }
};

export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.getAllComplaints(req.user?.role, req.user?.userId),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

export const getComplaintById = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.getComplaintById(
        Number(req.params.complaintId),
        req.user?.role,
        req.user?.lab_id,
      ),
    );
  } catch (error: any) {
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ message: "Complaint not found" });
    res
      .status(error.message.includes("FORBIDDEN") ? 403 : 500)
      .json({ message: error.message });
  }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.updateComplaintStatus(
        Number(req.params.complaintId),
        req.body.status,
      ),
    );
  } catch (error: any) {
    res
      .status(error.message.includes("VALIDATION") ? 400 : 500)
      .json({ message: error.message });
  }
};

export const updateComplaintRemarks = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.updateComplaintRemarks(
        Number(req.params.complaintId),
        req.body.remarks,
      ),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to update complaint remarks" });
  }
};

export const getComplaintsAnalytics = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.getComplaintsAnalytics(
        req.user?.role,
        req.user?.userId,
        req.query.startDate as string,
        req.query.endDate as string,
      ),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints analytics" });
  }
};

export const checkAssetComplaints = async (req: Request, res: Response) => {
  try {
    res.json(
      await ComplaintService.checkAssetComplaints(
        Number(req.params.assetId),
        req.user?.role,
        req.user?.lab_id,
      ),
    );
  } catch (error: any) {
    if (error.message.includes("NOT_FOUND"))
      return res.status(404).json({ hasExistingComplaint: false });
    res
      .status(error.message.includes("FORBIDDEN") ? 403 : 500)
      .json({ message: error.message });
  }
};
