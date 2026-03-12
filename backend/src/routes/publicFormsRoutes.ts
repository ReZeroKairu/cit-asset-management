import express from 'express';
import {
  createPublicLabRequest,
  createPublicEquipmentBorrow,
  createPublicSoftwareInstallation
} from '../controllers/publicFormsController';
import { validate, labRequestSchema, equipmentBorrowSchema, softwareInstallationSchema } from '../middleware/validation';
import { auditMiddleware } from '../middleware/audit';

const router = express.Router();

// Public form submission routes (no authentication required)
router.post('/lab-requests', auditMiddleware("CREATE", "public lab request"), createPublicLabRequest);
router.post('/equipment-borrows', auditMiddleware("CREATE", "public equipment borrow"), createPublicEquipmentBorrow);
router.post('/software-installations', auditMiddleware("CREATE", "public software installation"), createPublicSoftwareInstallation);

export default router;
