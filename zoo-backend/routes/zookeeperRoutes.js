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
  getFeedingTasks,
  getCleaningSchedules,
  getNotifications,
  getCleaningCardData,
  markHabitatCleaned,
  cancelCleaning,
} from "../controllers/zookeeperController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", getZookeeperStats);

// Feeding tasks (needs_feeding VIEW logic)
router.get("/feeding-tasks", getFeedingTasks);

// Cleaning schedules
router.get("/cleaning-schedules", getCleaningSchedules);

// Cleaning card data (uses cleaning_card_data view)
router.get("/cleaning-card-data", getCleaningCardData);

// Mark habitat as cleaned
router.post("/enclosures/:enclosureId/clean", markHabitatCleaned);

// Cancel/postpone cleaning
router.post("/enclosures/:enclosureId/skip-cleaning", cancelCleaning);

// Notifications
router.get("/notifications", getNotifications);

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
router.get(
  "/feeding-schedule/enclosure/:enclosureId",
  getFeedingScheduleByEnclosure
);
router.post("/feeding-schedule", createFeedingSchedule);
router.put("/feeding-schedule/:feedingId", updateFeedingSchedule);
router.delete("/feeding-schedule/:feedingId", deleteFeedingSchedule);

export default router;
