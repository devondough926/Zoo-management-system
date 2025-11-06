import express from "express";
import {
  getVeterinarianStats,
  getAnimalsByEnclosure,
  getAnimalVetHistory,
  getAllVetVisits,
  createVetVisit,
  updateAnimalHealthInfo,
  getAllEnclosures,
} from "../controllers/veterinarianController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", getVeterinarianStats);

// Enclosure routes
router.get("/enclosures", getAllEnclosures);
router.get("/enclosures/:enclosureId/animals", getAnimalsByEnclosure);

// Vet visit routes
router.get("/vet-visits", getAllVetVisits);
router.get("/vet-visits/animal/:animalId", getAnimalVetHistory);
router.post("/vet-visits", createVetVisit);

// Animal health update routes
router.patch("/animals/:animalId/health", updateAnimalHealthInfo);

export default router;