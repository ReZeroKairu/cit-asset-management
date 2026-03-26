import express from 'express';
import {
  createPublicLabRequest,
  createPublicEquipmentBorrow,
  createPublicSoftwareInstallation
} from '../controllers/publicFormsController';
import { createCITLabUser, getCITLabUsersLogs, getLabWorkstations, getCITLabUsersAnalytics, getRecentCITLabUsersLogs } from '../controllers/citLabUsersController';
import { validate, labRequestSchema, equipmentBorrowSchema, softwareInstallationSchema } from '../middleware/validation';
import { auditMiddleware } from '../middleware/audit';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public form submission routes (no authentication required)
router.post('/lab-requests', auditMiddleware("CREATE", "public lab request"), createPublicLabRequest);
router.post('/equipment-borrows', auditMiddleware("CREATE", "public equipment borrow"), createPublicEquipmentBorrow);
router.post('/software-installations', auditMiddleware("CREATE", "public software installation"), createPublicSoftwareInstallation);
router.post('/cit-lab-users', auditMiddleware("CREATE", "cit lab users log"), createCITLabUser);

// Protected view routes for CIT Lab Users logs (authentication required)
router.get('/cit-lab-users', authenticateToken, getCITLabUsersLogs);
router.get('/cit-lab-users/analytics', authenticateToken, getCITLabUsersAnalytics);
router.get('/cit-lab-users/recent', authenticateToken, getRecentCITLabUsersLogs);

// Public route for getting workstations for a specific lab
router.get('/labs/:lab_id/workstations', getLabWorkstations);

export default router;
