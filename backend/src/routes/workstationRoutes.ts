import { Router } from "express";
import {
  getAllWorkstations,
  createWorkstation,
  batchCreateWorkstations,
  getWorkstationDetails,
  updateWorkstation,
  deleteWorkstation,
} from "../controllers/workstationController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", getAllWorkstations);
router.post("/", createWorkstation);
router.post("/batch", batchCreateWorkstations);
router.get("/:name", getWorkstationDetails);
router.put("/:id", updateWorkstation);
router.delete("/:id", deleteWorkstation);

export default router;
