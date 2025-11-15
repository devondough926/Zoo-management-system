import express from "express";
import {
  setActiveWeather,
  clearWeather,
} from "../controllers/weatherController.js";

const router = express.Router();

// Activate a weather condition (body: { id } or { type })
router.post("/activate", setActiveWeather);

// Clear all active weather conditions
router.post("/clear", clearWeather);

export default router;
