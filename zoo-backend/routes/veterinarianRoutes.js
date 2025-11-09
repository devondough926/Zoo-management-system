import express from "express";
import {
  getVeterinarianStats,
  getAllAnimals,
  getAnimalsByEnclosure,
  getAnimalVetHistory,
  getAllVetVisits,
  createVetVisit,
  updateAnimalHealthInfo,
  getMedicalLogs,
  getVaccinationLogs,
  createMedicalLog,
  createVaccinationLog,
  getAllEnclosures,
} from "../controllers/veterinarianController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", getVeterinarianStats);

// Animals
router.get("/animals", getAllAnimals);

// Enclosure routes
router.get("/enclosures", getAllEnclosures);
router.get("/enclosures/:enclosureId/animals", getAnimalsByEnclosure);

// Vet visit routes
router.get("/vet-visits", getAllVetVisits);
router.get("/vet-visits/animal/:animalId", getAnimalVetHistory);
router.post("/vet-visits", createVetVisit);

// Medical & vaccination logs (stored in Animal_Care_Log)
router.get("/medical-logs", getMedicalLogs);
router.get("/medical-logs/animal/:animalId", getMedicalLogs);
router.post("/medical-logs", createMedicalLog);

router.get("/vaccination-logs", getVaccinationLogs);
router.get("/vaccination-logs/animal/:animalId", getVaccinationLogs);
router.post("/vaccination-logs", createVaccinationLog);

// Animal health update routes
router.patch("/animals/:animalId/health", updateAnimalHealthInfo);

export default router;
