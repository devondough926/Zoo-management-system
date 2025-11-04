import express from "express";
import { getConcessionStats } from "../controllers/foodController.js";

const router = express.Router();

router.get("/concession", getConcessionStats);

export default router;

