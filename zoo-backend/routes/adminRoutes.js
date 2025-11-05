import express from "express";
import {
  upload as azureUpload,
  uploadToAzure,
  deleteFromAzure,
  isAzureConfigured,
} from "../middleware/azureUpload.js";
import {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeSalary,
  getAllLocations,
  getEmployeesByLocation,
  updateLocationSupervisor,
  getAllExhibits,
  getExhibitById,
  updateExhibit,
  getAllAnimals,
  getAnimalById,
  addAnimal,
  updateAnimal,
  deleteAnimal,
  getRevenueData,
  getStatistics,
  getAllJobTitles,
  getAllEnclosures,
  getAllPurchases,
  getAllTickets,
  getPurchaseItems,
  getPurchaseConcessionItems,
  getAllMemberships,
  getPricing,
  updatePricing,
} from "../controllers/adminController.js";

const router = express.Router();

// Employee routes
router.get("/employees", getAllEmployees);
router.get("/employees/:id", getEmployeeById);
router.post("/employees", addEmployee);
router.put("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);
router.patch("/employees/:id/salary", updateEmployeeSalary);

// Location routes
router.get("/locations", getAllLocations);
router.get("/locations/:id/employees", getEmployeesByLocation);
router.patch("/locations/:id/supervisor", updateLocationSupervisor);

// Exhibit routes
router.get("/exhibits", getAllExhibits);
router.get("/exhibits/:id", getExhibitById);
router.put("/exhibits/:id", updateExhibit);

// Animal routes
router.get("/animals", getAllAnimals);
router.get("/animals/:id", getAnimalById);
router.post("/animals", addAnimal);
router.put("/animals/:id", updateAnimal);
router.delete("/animals/:id", deleteAnimal);

// Image deletion routes
router.delete("/exhibits/:id/remove-image", async (req, res) => {
  try {
    const { id } = req.params;

    // Import db connection and Azure delete function
    const db = (await import("../config/database.js")).default;
    const { deleteFromAzure } = await import("../middleware/azureUpload.js");

    // Get current image URL
    const [currentExhibit] = await db.query(
      "SELECT Image_URL FROM Exhibit WHERE Exhibit_ID = ?",
      [id]
    );

    if (!currentExhibit[0]?.Image_URL) {
      return res.status(404).json({ error: "No image found for this exhibit" });
    }

    // Delete image from Azure (pass full URL, deleteFromAzure will extract blob name)
    await deleteFromAzure(currentExhibit[0].Image_URL);

    // Remove image URL from database
    await db.query("UPDATE Exhibit SET Image_URL = NULL WHERE Exhibit_ID = ?", [
      id,
    ]);

    res.json({
      success: true,
      message: "Image removed successfully",
    });
  } catch (error) {
    console.error("Error removing exhibit image:", error);
    res.status(500).json({ error: "Failed to remove image" });
  }
});

router.delete("/animals/:id/remove-image", async (req, res) => {
  try {
    const { id } = req.params;

    // Import db connection and Azure delete function
    const db = (await import("../config/database.js")).default;
    const { deleteFromAzure } = await import("../middleware/azureUpload.js");

    // Get current image URL
    const [currentAnimal] = await db.query(
      "SELECT Image_URL FROM Animal WHERE Animal_ID = ?",
      [id]
    );

    if (!currentAnimal[0]?.Image_URL) {
      return res.status(404).json({ error: "No image found for this animal" });
    }

    // Delete image from Azure (pass full URL, deleteFromAzure will extract blob name)
    await deleteFromAzure(currentAnimal[0].Image_URL);

    // Remove image URL from database
    await db.query("UPDATE Animal SET Image_URL = NULL WHERE Animal_ID = ?", [
      id,
    ]);

    res.json({
      success: true,
      message: "Image removed successfully",
    });
  } catch (error) {
    console.error("Error removing animal image:", error);
    res.status(500).json({ error: "Failed to remove image" });
  }
});

// Exhibit image upload route with Azure Blob Storage
router.post(
  "/exhibits/:id/upload-image",
  azureUpload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Import db connection and Azure delete function
      const db = (await import("../config/database.js")).default;
      const { deleteFromAzure } = await import("../middleware/azureUpload.js");

      // Get current image URL to delete old file
      const [currentExhibit] = await db.query(
        "SELECT Image_URL FROM Exhibit WHERE Exhibit_ID = ?",
        [id]
      );

      // Delete old image from Azure if exists
      if (currentExhibit[0]?.Image_URL) {
        await deleteFromAzure(currentExhibit[0].Image_URL);
      }

      // req.file.url is set by azureUpload middleware
      const imageUrl = req.file.url;

      // Update exhibit with new image URL
      await db.query("UPDATE Exhibit SET Image_URL = ? WHERE Exhibit_ID = ?", [
        imageUrl,
        id,
      ]);

      res.json({
        success: true,
        imageUrl: imageUrl,
        filename: req.file.originalname,
      });
    } catch (error) {
      console.error("Error uploading exhibit image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// Animal image upload route with Azure Blob Storage
router.post(
  "/animals/:id/upload-image",
  azureUpload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Import db connection and Azure delete function
      const db = (await import("../config/database.js")).default;
      const { deleteFromAzure } = await import("../middleware/azureUpload.js");

      // Get current image URL to delete old file
      const [currentAnimal] = await db.query(
        "SELECT Image_URL FROM Animal WHERE Animal_ID = ?",
        [id]
      );

      // Delete old image from Azure if exists
      if (currentAnimal[0]?.Image_URL) {
        await deleteFromAzure(currentAnimal[0].Image_URL);
      }

      // req.file.url is set by azureUpload middleware
      const imageUrl = req.file.url;

      // Update animal with new image URL
      await db.query("UPDATE Animal SET Image_URL = ? WHERE Animal_ID = ?", [
        imageUrl,
        id,
      ]);

      res.json({
        success: true,
        imageUrl: imageUrl,
        filename: req.file.originalname,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// Analytics routes
router.get("/revenue", getRevenueData);
router.get("/statistics", getStatistics);

// Job titles route
router.get("/job-titles", getAllJobTitles);

// Enclosures route
router.get("/enclosures", getAllEnclosures);

// Purchase & transaction routes
router.get("/purchases", getAllPurchases);
router.get("/tickets", getAllTickets);
router.get("/purchase-items", getPurchaseItems);
router.get("/purchase-concession-items", getPurchaseConcessionItems);
router.get("/memberships", getAllMemberships);

// Pricing routes
router.get("/pricing", getPricing);
router.patch("/pricing", updatePricing);

export default router;
