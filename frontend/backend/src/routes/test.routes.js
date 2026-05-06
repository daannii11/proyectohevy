import { Router } from "express";
import { getTest, getTestData } from "../controllers/test.controller.js";

const router = Router();

router.get("/test", getTest);
router.get("/test-data", getTestData);

export default router;
