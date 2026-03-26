import express from 'express';
import {
  createLabRequest,
  getLabRequests,
  updateLabRequestStatus,
  updateLabRequestDetails,
  createEquipmentBorrow,
  getEquipmentBorrows,
  updateEquipmentBorrowStatus,
  updateEquipmentBorrowDetails,
  createSoftwareInstallation,
  getSoftwareInstallations,
  updateSoftwareInstallationStatus,
  updateSoftwareInstallationDetails
} from '../controllers/formsController';
import { authenticateToken } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Lab Request Routes
router.post('/lab-requests', auditMiddleware("CREATE", "lab request"), createLabRequest);
router.get('/lab-requests', getLabRequests);
router.put('/lab-requests/:id/status', auditMiddleware("UPDATE", "lab request status"), updateLabRequestStatus);
router.put('/lab-requests/:id', auditMiddleware("UPDATE", "lab request"), updateLabRequestDetails);

// Equipment Borrow Routes
router.post('/equipment-borrows', auditMiddleware("CREATE", "equipment borrow"), createEquipmentBorrow);
router.get('/equipment-borrows', getEquipmentBorrows);
router.put('/equipment-borrows/:id/status', auditMiddleware("UPDATE", "equipment borrow status"), updateEquipmentBorrowStatus);
router.put('/equipment-borrows/:id', auditMiddleware("UPDATE", "equipment borrow"), updateEquipmentBorrowDetails);

// Software Installation Routes
router.post('/software-installations', auditMiddleware("CREATE", "software installation"), createSoftwareInstallation);
router.get('/software-installations', getSoftwareInstallations);
router.put('/software-installations/:id/status', auditMiddleware("UPDATE", "software installation status"), updateSoftwareInstallationStatus);
router.put('/software-installations/:id', auditMiddleware("UPDATE", "software installation"), updateSoftwareInstallationDetails);

export default router;
