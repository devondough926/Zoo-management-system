import express from "express";
import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  loginEmployee,
  getEmployeeProfile,
} from "../controllers/authController.js";

const router = express.Router();

// Customer authentication routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Customer profile routes
router.get("/profile/:customerId", getCustomerProfile);
router.put("/profile/:customerId", updateCustomerProfile);
router.put("/profile/:customerId/password", changeCustomerPassword);

// Employee authentication routes
router.post("/employee/login", loginEmployee);
router.get("/employee/profile/:employeeId", getEmployeeProfile);

export default router;
