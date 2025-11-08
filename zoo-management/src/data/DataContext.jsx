/**
 * DataContext - Shared state management for Wildwood Zoo system
 *
 * This context provides centralized data management for:
 * - Animals: All zoo animals across 8 habitats
 * - Gift Shop Items: All items available in the gift shop
 * - Concession Items: All food/beverage items across 4 concession stands
 *
 * All additions, updates, and deletions are automatically reflected
 * across all pages and portals in real-time.
 */

import { createContext, useContext, useState, useEffect } from "react";

const DataContext = createContext(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function DataProvider({ children }) {
  const [animals, setAnimals] = useState([]);
  const [items, setItems] = useState([]);
  const [concessionItems, setConcessionItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [purchaseConcessionItems, setPurchaseConcessionItems] = useState([]);
  const [memberships, setMemberships] = useState([]);

  // Fetch animals from backend on mount
  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        console.log("Fetching animals...");
        const response = await fetch(`${API_BASE_URL}/admin/animals`);
        console.log("Animals response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched animals:", data.length);
          setAnimals(data);
        } else {
          console.error("Failed to fetch animals, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching animals:", error);
      }
    };
    fetchAnimals();
  }, []);

  // Fetch concession items from backend on mount
  useEffect(() => {
    const fetchConcessionItems = async () => {
      try {
        console.log("Fetching concession items...");
        const response = await fetch(`${API_BASE_URL}/food`);
        console.log("Concession items response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched concession items:", data.length);
          setConcessionItems(data);
        } else {
          console.error(
            "Failed to fetch concession items, status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Error fetching concession items:", error);
      }
    };
    fetchConcessionItems();
  }, []);

  // Fetch shop items from backend on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log("Fetching shop items...");
        const response = await fetch(`${API_BASE_URL}/shop/items`);
        console.log("Response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched items:", data.length);
          setItems(data);
        } else {
          console.error("Failed to fetch items, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, []);

  // Fetch purchase data for analytics
  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        // Fetch purchases
        const purchasesResponse = await fetch(`${API_BASE_URL}/shop/purchases`);
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchases(purchasesData);
        }

        // Fetch purchase items
        const purchaseItemsResponse = await fetch(
          `${API_BASE_URL}/shop/purchase-items`
        );
        if (purchaseItemsResponse.ok) {
          const purchaseItemsData = await purchaseItemsResponse.json();
          setPurchaseItems(purchaseItemsData);
        }

        // Also fetch concession purchase items so staff portals can compute stats locally
        try {
          const pcRes = await fetch(
            `${API_BASE_URL}/admin/purchase-concession-items`
          );
          if (pcRes.ok) {
            const pcData = await pcRes.json();
            setPurchaseConcessionItems(pcData);
          }
        } catch (err) {
          console.error("Error fetching concession purchase items:", err);
        }
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, []);

  const refreshItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shop/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error refreshing items:", error);
    }
  };

  // Animal operations
  const addAnimal = (animal) => {
    setAnimals((prev) => [...prev, animal]);
  };

  const updateAnimal = (animalId, updates) => {
    setAnimals((prev) =>
      prev.map((animal) =>
        animal.Animal_ID === animalId ? { ...animal, ...updates } : animal
      )
    );
  };

  const deleteAnimal = (animalId) => {
    setAnimals((prev) =>
      prev.filter((animal) => animal.Animal_ID !== animalId)
    );
  };

  // Item operations - NOW WITH API CALLS
  const addItem = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shop/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (response.ok) {
        const newItem = await response.json();
        setItems((prev) => [...prev, newItem]);
        return newItem;
      }
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  };

  const updateItem = async (itemId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shop/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updatedItem = await response.json();
        setItems((prev) =>
          prev.map((item) =>
            item.Item_ID === itemId ? { ...item, ...updatedItem } : item
          )
        );
        return updatedItem;
      }
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shop/items/${itemId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.Item_ID !== itemId));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  };

  // Concession item operations
  const addConcessionItem = (item) => {
    setConcessionItems((prev) => [...prev, item]);
  };

  const updateConcessionItem = (itemId, updates) => {
    setConcessionItems((prev) =>
      prev.map((item) =>
        item.Concession_Item_ID === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const deleteConcessionItem = (itemId) => {
    setConcessionItems((prev) =>
      prev.filter((item) => item.Concession_Item_ID !== itemId)
    );
  };

  // Purchase operations
  const addPurchase = (purchase) => {
    setPurchases((prev) => [...prev, purchase]);
  };

  // Ticket operations
  const addTicket = (ticket) => {
    setTickets((prev) => [...prev, ticket]);
  };

  // Purchase item operations
  const addPurchaseItem = (purchaseItem) => {
    setPurchaseItems((prev) => [...prev, purchaseItem]);
  };

  // Purchase concession item operations
  const addPurchaseConcessionItem = (purchaseConcessionItem) => {
    setPurchaseConcessionItems((prev) => [...prev, purchaseConcessionItem]);
  };

  // Membership operations
  const addMembership = (membership) => {
    setMemberships((prev) => [...prev, membership]);
  };

  const updateMembership = (customerId, updates) => {
    setMemberships((prev) =>
      prev.map((membership) =>
        membership.Customer_ID === customerId
          ? { ...membership, ...updates }
          : membership
      )
    );
  };

  return (
    <DataContext.Provider
      value={{
        animals,
        addAnimal,
        updateAnimal,
        deleteAnimal,
        items,
        addItem,
        updateItem,
        deleteItem,
        refreshItems,
        concessionItems,
        addConcessionItem,
        updateConcessionItem,
        deleteConcessionItem,
        purchases,
        addPurchase,
        tickets,
        addTicket,
        purchaseItems,
        addPurchaseItem,
        purchaseConcessionItems,
        addPurchaseConcessionItem,
        memberships,
        addMembership,
        updateMembership,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
