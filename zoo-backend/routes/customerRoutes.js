import express from "express";
import {
  getAllExhibits,
  getExhibitById,
  getAllActivities,
  getActivitiesByExhibit,
  getTodaysSchedule,
  getAllAnimals,
  getAllEnclosures,
  getPurchaseHistory,
  getPurchaseDetails,
  createPurchase,
} from "../controllers/customerController.js";

const router = express.Router();

// Exhibit routes
router.get("/exhibits", getAllExhibits);
router.get("/exhibits/:id", getExhibitById);

// Activity routes
router.get("/activities", getAllActivities);
router.get("/exhibits/:exhibitId/activities", getActivitiesByExhibit);

// Schedule routes
router.get("/schedule/today", getTodaysSchedule);

// Animal routes
router.get("/animals", getAllAnimals);

// Enclosure routes
router.get("/enclosures", getAllEnclosures);

// Purchase routes
router.get("/purchases/:customerId", getPurchaseHistory);
router.get("/purchases/:purchaseId/details", getPurchaseDetails);
router.post("/purchases", createPurchase);

export default router;
