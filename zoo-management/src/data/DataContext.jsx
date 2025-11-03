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
 *
 * Note: Animals, items, and concessionItems are temporarily loaded from mock data
 * for staff portals (Zookeeper, Veterinarian) until backend integration is complete.
 */

import { createContext, useContext, useState } from "react";
import {
  mockAnimals,
  items as mockItems,
  concessionItems as mockConcessionItems,
} from "./mockData";

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
  const [animals, setAnimals] = useState(mockAnimals);
  const [items, setItems] = useState(mockItems);
  const [concessionItems, setConcessionItems] = useState(mockConcessionItems);
  const [purchases, setPurchases] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [purchaseConcessionItems, setPurchaseConcessionItems] = useState([]);
  const [memberships, setMemberships] = useState([]);

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

  // Item operations
  const addItem = (item) => {
    setItems((prev) => [...prev, item]);
  };

  const updateItem = (itemId, updates) => {
    setItems((prev) =>
      prev.map((item) =>
        item.Item_ID === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const deleteItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.Item_ID !== itemId));
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
