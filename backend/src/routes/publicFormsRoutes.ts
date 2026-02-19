import express from 'express';
import {
  createPublicLabRequest,
  createPublicEquipmentBorrow,
  createPublicSoftwareInstallation
} from '../controllers/publicFormsController';

const router = express.Router();

// Public form submission routes (no authentication required)
router.post('/lab-requests', createPublicLabRequest);
router.post('/equipment-borrows', createPublicEquipmentBorrow);
router.post('/software-installations', createPublicSoftwareInstallation);

export default router;
