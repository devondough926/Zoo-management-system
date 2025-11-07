import express from "express";
import {
  getZookeeperStats,
  getAnimalsByEnclosure,
  getAnimalCareLogs,
  getAllCareLogs,
  createCareLog,
  getFeedingSchedule,
  getFeedingScheduleByEnclosure,
  createFeedingSchedule,
  updateFeedingSchedule,
  deleteFeedingSchedule,
  getAllEnclosures,
  getEnclosureStatus,
} from "../controllers/zookeeperController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", getZookeeperStats);

// Enclosure routes
router.get("/enclosures", getAllEnclosures);
router.get("/enclosures/:enclosureId/animals", getAnimalsByEnclosure);
router.get("/enclosures/:enclosureId/status", getEnclosureStatus);

// Care log routes
router.get("/care-logs", getAllCareLogs);
router.get("/care-logs/animal/:animalId", getAnimalCareLogs);
router.post("/care-logs", createCareLog);

// Feeding schedule routes
router.get("/feeding-schedule", getFeedingSchedule);
router.get("/feeding-schedule/enclosure/:enclosureId", getFeedingScheduleByEnclosure);
router.post("/feeding-schedule", createFeedingSchedule);
router.put("/feeding-schedule/:feedingId", updateFeedingSchedule);
router.delete("/feeding-schedule/:feedingId", deleteFeedingSchedule);

export default router;