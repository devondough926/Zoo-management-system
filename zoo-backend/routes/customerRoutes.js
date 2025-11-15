import express from "express";
import {
  getAllExhibits,
  getExhibitById,
  getAllActivities,
  getActivitiesByExhibit,
  getTodaysSchedule,
  getActivitiesByOrder,
  getActiveActivities,
  getAllAnimals,
  getAllExhibitsForAnimals,
  getPurchaseHistory,
  getPurchaseDetails,
  getMembership,
  createPurchase,
} from "../controllers/customerController.js";

const router = express.Router();

// Exhibit routes
router.get("/exhibits", getAllExhibits);
router.get("/exhibits/:id", getExhibitById);

// Activity routes
router.get("/activities", getAllActivities);
router.get("/activities/order/:order", getActivitiesByOrder);
router.get("/activities/active", getActiveActivities);
router.get("/exhibits/:exhibitId/activities", getActivitiesByExhibit);

// Schedule routes
router.get("/schedule/today", getTodaysSchedule);

// Animal routes
router.get("/animals", getAllAnimals);

// Exhibit routes (for animal lookup)
router.get("/exhibits-for-animals", getAllExhibitsForAnimals);

// Purchase routes
router.get("/purchases/history/:customerId", getPurchaseHistory);
router.get("/purchases/details/:purchaseId", getPurchaseDetails);
router.get("/membership/:customerId", getMembership);
router.post("/purchases", createPurchase);

export default router;
