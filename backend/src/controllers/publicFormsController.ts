// src/controllers/publicFormsController.ts
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

export const createPublicSoftwareInstallation = async (
  req: Request,
  res: Response,
) => {
  try {
    // Notice the "true" flag indicating this is a public form!
    const data = await FormsService.createSoftwareInstallation(
      req.body,
      getClientIP(req),
      true,
    );

    res.status(201).json({
      success: true,
      message: "Software installation request submitted successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to submit software installation request",
      error: error.message,
    });
  }
};
