import express from "express";
import { upload } from "../middleware/azureUpload.js";
import { 
  getAllFood, 
  addFood, 
  updateFood, 
  deleteFood
} from "../controllers/foodController.js";

const router = express.Router();

router.get("/", getAllFood);
router.post("/", upload.single("image"), addFood);
router.put("/:id", upload.single("image"), updateFood);
router.delete("/:id", deleteFood);

export default router;

