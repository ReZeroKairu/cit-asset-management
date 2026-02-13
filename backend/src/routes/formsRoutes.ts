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

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Lab Request Routes
router.post('/lab-requests', createLabRequest);
router.get('/lab-requests', getLabRequests);
router.put('/lab-requests/:id/status', updateLabRequestStatus);
router.put('/lab-requests/:id', updateLabRequestDetails);

// Equipment Borrow Routes
router.post('/equipment-borrows', createEquipmentBorrow);
router.get('/equipment-borrows', getEquipmentBorrows);
router.put('/equipment-borrows/:id/status', updateEquipmentBorrowStatus);
router.put('/equipment-borrows/:id', updateEquipmentBorrowDetails);

// Software Installation Routes
router.post('/software-installations', createSoftwareInstallation);
router.get('/software-installations', getSoftwareInstallations);
router.put('/software-installations/:id/status', updateSoftwareInstallationStatus);
router.put('/software-installations/:id', updateSoftwareInstallationDetails);

export default router;
