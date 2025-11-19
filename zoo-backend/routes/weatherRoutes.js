import express from "express";
import {
  setActiveWeather,
  clearWeather,
  getActiveWeather,
} from "../controllers/weatherController.js";

const router = express.Router();

// Activate a weather condition (body: { id } or { type })
router.post("/activate", setActiveWeather);

// Clear all active weather conditions
router.post("/clear", clearWeather);

// Get currently active weather condition (returns null or an object)
router.get("/active", getActiveWeather);

export default router;
