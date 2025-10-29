/**
 * Example: Integrating Cache Management with Admin Operations
 *
 * This shows how to update the AdminPortal to invalidate caches
 * after data modifications to keep the UI in sync
 */

import { invalidateRelatedCaches, CACHE_KEYS } from "../utils/cacheManager";

// Example 1: After adding a new animal
const handleAddAnimal = async (animalData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/animals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(animalData),
    });

    if (response.ok) {
      // Clear related caches so the customer pages show fresh data
      invalidateRelatedCaches("animal");

      // Show success message
      toast.success("Animal added successfully!");

      // Refetch admin data
      fetchAnimals();
    }
  } catch (error) {
    console.error("Error adding animal:", error);
    toast.error("Failed to add animal");
  }
};

// Example 2: After updating exhibit information
const handleUpdateExhibit = async (exhibitId, updates) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/exhibits/${exhibitId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }
    );

    if (response.ok) {
      invalidateRelatedCaches("exhibit");
      toast.success("Exhibit updated!");
      fetchExhibits();
    }
  } catch (error) {
    console.error("Error updating exhibit:", error);
    toast.error("Failed to update exhibit");
  }
};

// Example 3: After deleting an employee
const handleDeleteEmployee = async (employeeId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/employees/${employeeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      invalidateRelatedCaches("employee");
      toast.success("Employee removed");
      fetchEmployees();
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    toast.error("Failed to delete employee");
  }
};

// Example 4: After updating pricing
const handleUpdatePricing = async (newPrices) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pricing`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newPrices),
    });

    if (response.ok) {
      invalidateRelatedCaches("pricing");
      toast.success("Prices updated!");
    }
  } catch (error) {
    console.error("Error updating pricing:", error);
    toast.error("Failed to update pricing");
  }
};

// Example 5: On logout - clear everything
const handleLogout = () => {
  invalidateRelatedCaches("all");
  localStorage.removeItem("token");
  navigate("/login");
};

/**
 * Quick Integration Guide for AdminPortal.jsx:
 *
 * 1. Import at the top:
 *    import { invalidateRelatedCaches } from '../utils/cacheManager';
 *
 * 2. Add to ALL create/update/delete operations:
 *    - After successful animal operations: invalidateRelatedCaches('animal')
 *    - After exhibit operations: invalidateRelatedCaches('exhibit')
 *    - After employee operations: invalidateRelatedCaches('employee')
 *    - After pricing updates: invalidateRelatedCaches('pricing')
 *    - On logout: invalidateRelatedCaches('all')
 *
 * 3. This ensures customer-facing pages always show fresh data!
 */
