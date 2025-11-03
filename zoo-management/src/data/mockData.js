// Mock data for staff portals - Reference data only
// Note: Most data is now fetched from the backend API
// This file contains only reference data needed for staff portals

// Locations (matching database exactly)
export const locations = [
  {
    Location_ID: 1,
    Zone: "A",
    Location_Description: "African Savanna Area",
    Supervisor_ID: 200,
  },
  {
    Location_ID: 2,
    Zone: "B",
    Location_Description: "Primate & Reptile Area",
    Supervisor_ID: 201,
  },
  {
    Location_ID: 3,
    Zone: "C",
    Location_Description: "Australian & Tropical Area",
    Supervisor_ID: 202,
  },
  {
    Location_ID: 4,
    Zone: "D",
    Location_Description: "Bird & North American Area",
    Supervisor_ID: 203,
  },
];

// Enclosures (8 habitats matching database exhibits)
export const enclosures = [
  {
    Enclosure_ID: 1,
    Enclosure_Name: "African Savanna",
    Location_ID: 1,
    Size: 5000,
    Enclosure_Type: "Outdoor",
  },
  {
    Enclosure_ID: 2,
    Enclosure_Name: "Big Cat Territory",
    Location_ID: 1,
    Size: 3000,
    Enclosure_Type: "Indoor/Outdoor",
  },
  {
    Enclosure_ID: 3,
    Enclosure_Name: "Primate Forest",
    Location_ID: 2,
    Size: 2500,
    Enclosure_Type: "Outdoor",
  },
  {
    Enclosure_ID: 4,
    Enclosure_Name: "Reptile House",
    Location_ID: 2,
    Size: 1800,
    Enclosure_Type: "Indoor",
  },
  {
    Enclosure_ID: 5,
    Enclosure_Name: "Australian Outback",
    Location_ID: 3,
    Size: 4000,
    Enclosure_Type: "Outdoor",
  },
  {
    Enclosure_ID: 6,
    Enclosure_Name: "Tropical Rainforest",
    Location_ID: 3,
    Size: 3200,
    Enclosure_Type: "Climate Controlled",
  },
  {
    Enclosure_ID: 7,
    Enclosure_Name: "Bird Sanctuary",
    Location_ID: 4,
    Size: 2800,
    Enclosure_Type: "Outdoor",
  },
  {
    Enclosure_ID: 8,
    Enclosure_Name: "North American Wilderness",
    Location_ID: 4,
    Size: 3500,
    Enclosure_Type: "Outdoor",
  },
];

// Gift Shops
export const giftShops = [
  { Shop_ID: 1, shop_Name: "Main Gift Shop", Location_ID: 1 },
];

// Gift Shop Items
export const items = [
  {
    Item_ID: 1,
    Item_Name: "Plush Elephant",
    Price: 24.99,
    Shop_ID: 1,
    Category: "Toys & Plushies",
  },
  {
    Item_ID: 2,
    Item_Name: "Zoo T-Shirt",
    Price: 19.99,
    Shop_ID: 1,
    Category: "Apparel",
  },
  {
    Item_ID: 3,
    Item_Name: "Animal Encyclopedia",
    Price: 29.99,
    Shop_ID: 1,
    Category: "Decorations & Others",
  },
  {
    Item_ID: 4,
    Item_Name: "Reusable Water Bottle",
    Price: 14.99,
    Shop_ID: 1,
    Category: "Accessories & Souvenirs",
  },
  {
    Item_ID: 5,
    Item_Name: "Safari Hat",
    Price: 16.99,
    Shop_ID: 1,
    Category: "Apparel",
  },
  {
    Item_ID: 6,
    Item_Name: "Plush Tiger",
    Price: 22.99,
    Shop_ID: 1,
    Category: "Toys & Plushies",
  },
  {
    Item_ID: 7,
    Item_Name: "Binoculars",
    Price: 34.99,
    Shop_ID: 1,
    Category: "Accessories & Souvenirs",
  },
  {
    Item_ID: 8,
    Item_Name: "Animal Sticker Collection",
    Price: 5.99,
    Shop_ID: 1,
    Category: "Accessories & Souvenirs",
  },
];

// Concession Stands (matching database exactly)
export const concessionStands = [
  {
    Stand_ID: 1,
    Stand_Name: "Safari Grill",
    Stand_Type: "Burgers & Grilled Items",
    Location_ID: 1,
  },
  {
    Stand_ID: 2,
    Stand_Name: "Desert Diner",
    Stand_Type: "Pizza & Italian",
    Location_ID: 2,
  },
  {
    Stand_ID: 3,
    Stand_Name: "Rainforest Refreshments",
    Stand_Type: "Fresh & Healthy Options",
    Location_ID: 3,
  },
  {
    Stand_ID: 4,
    Stand_Name: "Polar Cafe",
    Stand_Type: "Ice Cream & Desserts",
    Location_ID: 4,
  },
];

// Concession Items (matching database stand types)
export const concessionItems = [
  // Safari Grill - Burgers & Grilled Items
  {
    Concession_Item_ID: 1,
    Stand_ID: 1,
    Item_Name: "Classic Cheeseburger",
    Price: 12.99,
  },
  {
    Concession_Item_ID: 2,
    Stand_ID: 1,
    Item_Name: "BBQ Pulled Pork Sandwich",
    Price: 13.99,
  },
  {
    Concession_Item_ID: 3,
    Stand_ID: 1,
    Item_Name: "Grilled Chicken Wrap",
    Price: 11.99,
  },
  {
    Concession_Item_ID: 4,
    Stand_ID: 1,
    Item_Name: "French Fries",
    Price: 4.99,
  },
  {
    Concession_Item_ID: 5,
    Stand_ID: 1,
    Item_Name: "Chicken Tenders",
    Price: 9.99,
  },

  // Desert Diner - Pizza & Italian
  {
    Concession_Item_ID: 16,
    Stand_ID: 2,
    Item_Name: "Cheese Pizza Slice",
    Price: 6.99,
  },
  {
    Concession_Item_ID: 17,
    Stand_ID: 2,
    Item_Name: "Pepperoni Pizza Slice",
    Price: 7.99,
  },
  {
    Concession_Item_ID: 18,
    Stand_ID: 2,
    Item_Name: "Spaghetti & Meatballs",
    Price: 12.99,
  },
  {
    Concession_Item_ID: 19,
    Stand_ID: 2,
    Item_Name: "Garlic Bread",
    Price: 4.99,
  },
  {
    Concession_Item_ID: 20,
    Stand_ID: 2,
    Item_Name: "Italian Sub",
    Price: 10.99,
  },

  // Rainforest Refreshments - Fresh & Healthy Options
  {
    Concession_Item_ID: 11,
    Stand_ID: 3,
    Item_Name: "Tropical Fruit Bowl",
    Price: 8.99,
  },
  { Concession_Item_ID: 12, Stand_ID: 3, Item_Name: "Acai Bowl", Price: 10.99 },
  {
    Concession_Item_ID: 13,
    Stand_ID: 3,
    Item_Name: "Fresh Squeezed Juice",
    Price: 5.99,
  },
  {
    Concession_Item_ID: 14,
    Stand_ID: 3,
    Item_Name: "Green Smoothie",
    Price: 7.99,
  },
  {
    Concession_Item_ID: 15,
    Stand_ID: 3,
    Item_Name: "Yogurt Parfait",
    Price: 6.99,
  },

  // Polar Cafe - Ice Cream & Desserts
  {
    Concession_Item_ID: 6,
    Stand_ID: 4,
    Item_Name: "Vanilla Ice Cream Cone",
    Price: 5.99,
  },
  {
    Concession_Item_ID: 7,
    Stand_ID: 4,
    Item_Name: "Chocolate Sundae",
    Price: 7.99,
  },
  {
    Concession_Item_ID: 8,
    Stand_ID: 4,
    Item_Name: "Fruit Smoothie",
    Price: 6.99,
  },
  {
    Concession_Item_ID: 9,
    Stand_ID: 4,
    Item_Name: "Frozen Lemonade",
    Price: 4.99,
  },
  { Concession_Item_ID: 10, Stand_ID: 4, Item_Name: "Milkshake", Price: 6.99 },
];
