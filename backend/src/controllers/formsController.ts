// src/controllers/formsController.ts
import { Request, Response } from "express";
import * as FormsService from "../services/formsService";

const getClientIP = (req: any) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
    req.ip
  );
};

export const createSoftwareInstallation = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await FormsService.createSoftwareInstallation(
      req.body,
      getClientIP(req),
      false,
    );
    res.status(201).json({
      success: true,
      message: "Software installation request submitted successfully",
      data,
    });
  } catch (error: any) {
    console.error("Error creating software installation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit software installation request",
      error: error.message,
    });
  }
};

export const getSoftwareInstallations = async (req: Request, res: Response) => {
  try {
    const data = await FormsService.getSoftwareInstallations({
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    });
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching software installations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch software installations",
      error: error.message,
    });
  }
};

export const updateSoftwareInstallationStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await FormsService.updateSoftwareInstallationStatus(
      parseInt(req.params.id as string),
      req.body.status,
    );
    res.status(200).json({
      success: true,
      message: "Software installation status updated successfully",
      data,
    });
  } catch (error: any) {
    if (error.message.includes("VALIDATION"))
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        error: error.message,
      });
    res.status(500).json({
      success: false,
      message: "Failed to update software installation status",
      error: error.message,
    });
  }
};

export const updateSoftwareInstallationDetails = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await FormsService.updateSoftwareInstallationDetails(
      parseInt(req.params.id as string),
      req.body,
    );
    res.status(200).json({
      success: true,
      message: "Software installation details updated successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update software installation details",
      error: error.message,
    });
  }
};
