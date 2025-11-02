// Mock data matching the MySQL database schema exactly

// Current user state with localStorage persistence
export let currentUser = (() => {
  try {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

export let currentUserType = (() => {
  try {
    return localStorage.getItem("currentUserType") || null;
  } catch {
    return null;
  }
})();

export const setCurrentUser = (user, type) => {
  currentUser = user;
  currentUserType = type;

  if (user && type) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("currentUserType", type);
  } else {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserType");
  }
};

// Job Titles (matching database exactly)
export const jobTitles = [
  {
    Job_ID: 1,
    Title: "Administrator",
    Description: "Full system access and management",
    Email: "admin@zoo.com",
    Account_Password: "admin123",
  },
  {
    Job_ID: 2,
    Title: "Supervisor",
    Description: "Zone supervision and operations",
    Email: "supervisor@zoo.com",
    Account_Password: "super123",
  },
  {
    Job_ID: 3,
    Title: "Veterinarian",
    Description: "Animal health and medical care",
    Email: "vet@zoo.com",
    Account_Password: "vet123",
  },
  {
    Job_ID: 4,
    Title: "Zookeeper",
    Description: "Animal care and habitat management",
    Email: "keeper@zoo.com",
    Account_Password: "keeper123",
  },
  {
    Job_ID: 5,
    Title: "Concession Worker",
    Description: "Food service operations",
    Email: "food@zoo.com",
    Account_Password: "food123",
  },
  {
    Job_ID: 6,
    Title: "Gift Shop Worker",
    Description: "Retail operations and inventory",
    Email: "shop@zoo.com",
    Account_Password: "shop123",
  },
];

// Login Accounts - Only 5 role-based accounts (excluding Supervisor)
// In the DB, supervisors use the Zookeeper account (Job_ID 4)
export const loginAccounts = [
  {
    Employee_ID: 1,
    First_Name: "Admin",
    Last_Name: "Account",
    Birthdate: "1980-01-01",
    Sex: "M",
    Job_ID: 1,
    Salary: 85000,
    Email: "admin@zoo.com",
    Address: "WildWood Zoo Administration",
    Supervisor_ID: null,
    Job_Title: jobTitles[0],
  },
  {
    Employee_ID: 2,
    First_Name: "Veterinarian",
    Last_Name: "Account",
    Birthdate: "1985-01-01",
    Sex: "F",
    Job_ID: 3,
    Salary: 72000,
    Email: "vet@zoo.com",
    Address: "WildWood Zoo Veterinary",
    Supervisor_ID: null,
    Job_Title: jobTitles[2],
  },
  {
    Employee_ID: 3,
    First_Name: "Zookeeper",
    Last_Name: "Account",
    Birthdate: "1990-01-01",
    Sex: "M",
    Job_ID: 4,
    Salary: 45000,
    Email: "keeper@zoo.com",
    Address: "WildWood Zoo Animal Care",
    Supervisor_ID: null,
    Job_Title: jobTitles[3],
  },
  {
    Employee_ID: 4,
    First_Name: "Gift Shop",
    Last_Name: "Account",
    Birthdate: "1992-01-01",
    Sex: "F",
    Job_ID: 6,
    Salary: 35000,
    Email: "shop@zoo.com",
    Address: "WildWood Zoo Gift Shop",
    Supervisor_ID: null,
    Job_Title: jobTitles[5],
  },
  {
    Employee_ID: 5,
    First_Name: "Concession",
    Last_Name: "Account",
    Birthdate: "1988-01-01",
    Sex: "M",
    Job_ID: 5,
    Salary: 32000,
    Email: "food@zoo.com",
    Address: "WildWood Zoo Concessions",
    Supervisor_ID: null,
    Job_Title: jobTitles[4],
  },
];

// Individual Employee Records (for database/admin tracking only, NOT for login)
// TOTAL: 8 employees (4 Zone Supervisors + 1 Vet + 1 Zookeeper + 1 Gift Shop Worker + 1 Concession Worker)
export const employeeRecords = [
  // Veterinarian (1 total)
  {
    Employee_ID: 101,
    First_Name: "Sarah",
    Last_Name: "Thompson",
    Birthdate: "1985-03-22",
    Sex: "F",
    Job_ID: 3,
    Salary: 72000,
    Email: "sarah.thompson@zoo.com",
    Address: "456 Medical Ave, Zoo City, ZC 12345",
    Supervisor_ID: null,
    Job_Title: jobTitles[2],
  },
  // Zone Supervisors (4 total - Zookeepers with zone management responsibilities)
  {
    Employee_ID: 200,
    First_Name: "Marcus",
    Last_Name: "Williams",
    Birthdate: "1978-04-15",
    Sex: "M",
    Job_ID: 4,
    Salary: 68000,
    Email: "marcus.williams@zoo.com",
    Address: "100 Zone A Blvd, Zoo City, ZC 12345",
    Supervisor_ID: null,
    Job_Title: jobTitles[3],
  },
  {
    Employee_ID: 201,
    First_Name: "Rachel",
    Last_Name: "Anderson",
    Birthdate: "1980-08-22",
    Sex: "F",
    Job_ID: 4,
    Salary: 68000,
    Email: "rachel.anderson@zoo.com",
    Address: "200 Zone B Way, Zoo City, ZC 12345",
    Supervisor_ID: null,
    Job_Title: jobTitles[3],
  },
  {
    Employee_ID: 202,
    First_Name: "James",
    Last_Name: "Chen",
    Birthdate: "1982-11-10",
    Sex: "M",
    Job_ID: 4,
    Salary: 68000,
    Email: "james.chen@zoo.com",
    Address: "300 Zone C Ave, Zoo City, ZC 12345",
    Supervisor_ID: null,
    Job_Title: jobTitles[3],
  },
  {
    Employee_ID: 203,
    First_Name: "Linda",
    Last_Name: "Garcia",
    Birthdate: "1979-06-18",
    Sex: "F",
    Job_ID: 4,
    Salary: 68000,
    Email: "linda.garcia@zoo.com",
    Address: "400 Zone D Dr, Zoo City, ZC 12345",
    Supervisor_ID: null,
    Job_Title: jobTitles[3],
  },
  // Regular Zookeeper (1 total)
  {
    Employee_ID: 204,
    First_Name: "Alex",
    Last_Name: "Brown",
    Birthdate: "1991-04-12",
    Sex: "M",
    Job_ID: 4,
    Salary: 44000,
    Email: "alex.brown@zoo.com",
    Address: "111 Safari Lane, Zoo City, ZC 12345",
    Supervisor_ID: 200,
    Job_Title: jobTitles[3],
  },
  // Gift Shop Worker (1 total)
  {
    Employee_ID: 300,
    First_Name: "Emily",
    Last_Name: "Davis",
    Birthdate: "1992-11-05",
    Sex: "F",
    Job_ID: 6,
    Salary: 35000,
    Email: "emily.davis@zoo.com",
    Address: "321 Retail Blvd, Zoo City, ZC 12345",
    Supervisor_ID: null,
    Job_Title: jobTitles[5],
  },
  // Concession Worker (1 total)
  {
    Employee_ID: 400,
    First_Name: "Carlos",
    Last_Name: "Martinez",
    Birthdate: "1988-09-18",
    Sex: "M",
    Job_ID: 5,
    Salary: 32000,
    Email: "carlos.martinez@zoo.com",
    Address: "654 Food Court, Zoo City, ZC 12345",
    Supervisor_ID: 200,
    Job_Title: jobTitles[4],
  },
];

// Merge login accounts and employee records for compatibility
export const employees = employeeRecords;

// Sample Customer for login
export const customers = [
  {
    Customer_ID: 1,
    First_Name: "John",
    Last_Name: "Customer",
    Email: "customer@zoo.com",
    Customer_Password: "customer123",
    Phone: "555-0101",
  },
];

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

// Exhibits (matching database exactly)
export const exhibits = [
  {
    Exhibit_ID: 1,
    exhibit_Name: "African Savanna",
    exhibit_Description:
      "Experience the vastness of the African plains with elephants, giraffes, and zebras",
    Capacity: 100,
    Location_ID: 1,
    Display_Time: "14:00:00",
  },
  {
    Exhibit_ID: 2,
    exhibit_Name: "Big Cat Territory",
    exhibit_Description:
      "Come face-to-face with magnificent big cats including tigers, lions, and leopards",
    Capacity: 75,
    Location_ID: 1,
    Display_Time: "11:00:00",
  },
  {
    Exhibit_ID: 3,
    exhibit_Name: "Primate Forest",
    exhibit_Description:
      "Walk through a lush forest habitat and observe gorillas, chimpanzees, and orangutans",
    Capacity: 60,
    Location_ID: 2,
    Display_Time: "12:30:00",
  },
  {
    Exhibit_ID: 4,
    exhibit_Name: "Reptile House",
    exhibit_Description:
      "Discover the fascinating world of reptiles including snakes, lizards, crocodiles, and tortoises",
    Capacity: 50,
    Location_ID: 2,
    Display_Time: "13:00:00",
  },
  {
    Exhibit_ID: 5,
    exhibit_Name: "Australian Outback",
    exhibit_Description:
      "Meet kangaroos, koalas, and other unique wildlife from down under",
    Capacity: 80,
    Location_ID: 3,
    Display_Time: "14:30:00",
  },
  {
    Exhibit_ID: 6,
    exhibit_Name: "Tropical Rainforest",
    exhibit_Description:
      "Immerse yourself in a tropical paradise complete with exotic birds, sloths, and tree frogs",
    Capacity: 70,
    Location_ID: 3,
    Display_Time: "13:30:00",
  },
  {
    Exhibit_ID: 7,
    exhibit_Name: "Bird Sanctuary",
    exhibit_Description:
      "A peaceful aviary showcasing flamingos, eagles, and other magnificent birds",
    Capacity: 90,
    Location_ID: 4,
    Display_Time: "15:00:00",
  },
  {
    Exhibit_ID: 8,
    exhibit_Name: "North American Wilderness",
    exhibit_Description:
      "Explore the rugged beauty of North America with grizzly bears, wolves, and elk",
    Capacity: 85,
    Location_ID: 4,
    Display_Time: "15:30:00",
  },
];

// Exhibit Activities (matching database exactly)
export const exhibitActivities = [
  {
    Activity_ID: 1,
    Exhibit_ID: 1,
    Activity_Name: "Elephant Enrichment",
    Activity_Description:
      "Watch our elephants engage with enrichment activities",
    Activity_Order: 1,
  },
  {
    Activity_ID: 2,
    Exhibit_ID: 1,
    Activity_Name: "Giraffe Encounter",
    Activity_Description: "Get up close with our gentle giants",
    Activity_Order: 2,
  },
  {
    Activity_ID: 3,
    Exhibit_ID: 2,
    Activity_Name: "Lion Feeding Time",
    Activity_Description: "Witness the power of big cats during feeding",
    Activity_Order: 1,
  },
  {
    Activity_ID: 4,
    Exhibit_ID: 2,
    Activity_Name: "Big Cat Talk",
    Activity_Description: "Learn about conservation efforts for big cats",
    Activity_Order: 2,
  },
  {
    Activity_ID: 5,
    Exhibit_ID: 3,
    Activity_Name: "Primate Playgroup",
    Activity_Description: "Observe social interactions among primates",
    Activity_Order: 1,
  },
  {
    Activity_ID: 6,
    Exhibit_ID: 3,
    Activity_Name: "Monkey Mischief Show",
    Activity_Description: "Enjoy entertaining primate demonstrations",
    Activity_Order: 2,
  },
  {
    Activity_ID: 7,
    Exhibit_ID: 4,
    Activity_Name: "Reptile Discovery",
    Activity_Description: "Discover fascinating facts about reptiles",
    Activity_Order: 1,
  },
  {
    Activity_ID: 8,
    Exhibit_ID: 4,
    Activity_Name: "Feeding Demonstration",
    Activity_Description: "Watch feeding time for our reptile residents",
    Activity_Order: 2,
  },
  {
    Activity_ID: 9,
    Exhibit_ID: 5,
    Activity_Name: "Kangaroo Feeding",
    Activity_Description: "Hand-feed our friendly kangaroos",
    Activity_Order: 1,
  },
  {
    Activity_ID: 10,
    Exhibit_ID: 5,
    Activity_Name: "Koala Keeper Talk",
    Activity_Description: "Learn about koala care and conservation",
    Activity_Order: 2,
  },
  {
    Activity_ID: 11,
    Exhibit_ID: 6,
    Activity_Name: "Bird Feeding",
    Activity_Description: "Feed exotic tropical birds",
    Activity_Order: 1,
  },
  {
    Activity_ID: 12,
    Exhibit_ID: 6,
    Activity_Name: "Rainforest Tour",
    Activity_Description: "Guided walk through our rainforest habitat",
    Activity_Order: 2,
  },
  {
    Activity_ID: 13,
    Exhibit_ID: 7,
    Activity_Name: "Flight Demonstration",
    Activity_Description: "Amazing birds in free flight",
    Activity_Order: 1,
  },
  {
    Activity_ID: 14,
    Exhibit_ID: 7,
    Activity_Name: "Flamingo Talk",
    Activity_Description: "Learn about our flamingo flock",
    Activity_Order: 2,
  },
  {
    Activity_ID: 15,
    Exhibit_ID: 8,
    Activity_Name: "Bear Country Talk",
    Activity_Description: "Discover North American bear species",
    Activity_Order: 1,
  },
  {
    Activity_ID: 16,
    Exhibit_ID: 8,
    Activity_Name: "Wolf Howl",
    Activity_Description: "Experience the call of the wild",
    Activity_Order: 2,
  },
];

// Animals (updated to use Weight instead of Height, and added Health_Status and Is_Vaccinated)
export const animals = [
  // Enclosure 1 - African Savanna (6 animals)
  {
    Animal_ID: 1,
    Animal_Name: "Luna",
    Species: "African Elephant",
    Gender: "F",
    Weight: 8000,
    Birthday: "2018-05-12",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 1,
    Enclosure: enclosures[0],
  },
  {
    Animal_ID: 9,
    Animal_Name: "Trunks",
    Species: "African Elephant",
    Gender: "M",
    Weight: 10500,
    Birthday: "2015-08-20",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 1,
    Enclosure: enclosures[0],
  },
  {
    Animal_ID: 10,
    Animal_Name: "Ella",
    Species: "African Elephant",
    Gender: "F",
    Weight: 6500,
    Birthday: "2020-03-15",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 1,
    Enclosure: enclosures[0],
  },
  {
    Animal_ID: 11,
    Animal_Name: "Stripe",
    Species: "Zebra",
    Gender: "M",
    Weight: 850,
    Birthday: "2019-07-22",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 1,
    Enclosure: enclosures[0],
  },
  {
    Animal_ID: 12,
    Animal_Name: "Dash",
    Species: "Zebra",
    Gender: "F",
    Weight: 775,
    Birthday: "2021-04-10",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 1,
    Enclosure: enclosures[0],
  },
  {
    Animal_ID: 37,
    Animal_Name: "Speedy",
    Species: "Ostrich",
    Gender: "M",
    Weight: 320,
    Birthday: "2022-02-18",
    Health_Status: "Good",
    Is_Vaccinated: false,
    Enclosure_ID: 1,
    Enclosure: enclosures[0],
  },

  // Enclosure 2 - Big Cat Territory (5 animals)
  {
    Animal_ID: 2,
    Animal_Name: "Atlas",
    Species: "Bengal Tiger",
    Gender: "M",
    Weight: 420,
    Birthday: "2017-09-05",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 2,
    Enclosure: enclosures[1],
  },
  {
    Animal_ID: 7,
    Animal_Name: "Simba",
    Species: "African Lion",
    Gender: "M",
    Weight: 450,
    Birthday: "2016-11-12",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 2,
    Enclosure: enclosures[1],
  },
  {
    Animal_ID: 8,
    Animal_Name: "Nala",
    Species: "African Lion",
    Gender: "F",
    Weight: 320,
    Birthday: "2017-01-25",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 2,
    Enclosure: enclosures[1],
  },
  {
    Animal_ID: 15,
    Animal_Name: "Raja",
    Species: "Bengal Tiger",
    Gender: "F",
    Weight: 310,
    Birthday: "2019-06-08",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 2,
    Enclosure: enclosures[1],
  },
  {
    Animal_ID: 16,
    Animal_Name: "Stripes",
    Species: "Bengal Tiger",
    Gender: "M",
    Weight: 430,
    Birthday: "2018-12-14",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 2,
    Enclosure: enclosures[1],
  },

  // Enclosure 3 - Primate Forest (4 animals)
  {
    Animal_ID: 27,
    Animal_Name: "Coco",
    Species: "Capuchin Monkey",
    Gender: "F",
    Weight: 7,
    Birthday: "2021-05-10",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 3,
    Enclosure: enclosures[2],
  },
  {
    Animal_ID: 28,
    Animal_Name: "George",
    Species: "Gorilla",
    Gender: "M",
    Weight: 400,
    Birthday: "2012-08-14",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 3,
    Enclosure: enclosures[2],
  },
  {
    Animal_ID: 32,
    Animal_Name: "Charlie",
    Species: "Chimpanzee",
    Gender: "M",
    Weight: 130,
    Birthday: "2015-11-22",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 3,
    Enclosure: enclosures[2],
  },
  {
    Animal_ID: 33,
    Animal_Name: "Mia",
    Species: "Chimpanzee",
    Gender: "F",
    Weight: 100,
    Birthday: "2017-04-10",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 3,
    Enclosure: enclosures[2],
  },

  // Enclosure 4 - Reptile House (5 animals)
  {
    Animal_ID: 31,
    Animal_Name: "Cleo",
    Species: "Python",
    Gender: "F",
    Weight: 150,
    Birthday: "2020-08-30",
    Health_Status: "Good",
    Is_Vaccinated: false,
    Enclosure_ID: 4,
    Enclosure: enclosures[3],
  },
  {
    Animal_ID: 34,
    Animal_Name: "Rex",
    Species: "Nile Crocodile",
    Gender: "M",
    Weight: 1200,
    Birthday: "2010-06-15",
    Health_Status: "Good",
    Is_Vaccinated: false,
    Enclosure_ID: 4,
    Enclosure: enclosures[3],
  },
  {
    Animal_ID: 35,
    Animal_Name: "Ziggy",
    Species: "Green Iguana",
    Gender: "M",
    Weight: 15,
    Birthday: "2019-03-25",
    Health_Status: "Excellent",
    Is_Vaccinated: false,
    Enclosure_ID: 4,
    Enclosure: enclosures[3],
  },
  {
    Animal_ID: 36,
    Animal_Name: "Spike",
    Species: "Bearded Dragon",
    Gender: "M",
    Weight: 0.9,
    Birthday: "2021-07-12",
    Health_Status: "Excellent",
    Is_Vaccinated: false,
    Enclosure_ID: 4,
    Enclosure: enclosures[3],
  },
  {
    Animal_ID: 65,
    Animal_Name: "Slider",
    Species: "Sea Turtle",
    Gender: "M",
    Weight: 350,
    Birthday: "2010-04-15",
    Health_Status: "Fair",
    Is_Vaccinated: false,
    Enclosure_ID: 4,
    Enclosure: enclosures[3],
  },

  // Enclosure 5 - Australian Outback (5 animals)
  {
    Animal_ID: 38,
    Animal_Name: "Joey",
    Species: "Kangaroo",
    Gender: "M",
    Weight: 180,
    Birthday: "2019-01-20",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 5,
    Enclosure: enclosures[4],
  },
  {
    Animal_ID: 39,
    Animal_Name: "Sheila",
    Species: "Kangaroo",
    Gender: "F",
    Weight: 95,
    Birthday: "2020-05-15",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 5,
    Enclosure: enclosures[4],
  },
  {
    Animal_ID: 40,
    Animal_Name: "Matilda",
    Species: "Koala",
    Gender: "F",
    Weight: 20,
    Birthday: "2018-09-10",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 5,
    Enclosure: enclosures[4],
  },
  {
    Animal_ID: 48,
    Animal_Name: "Boomer",
    Species: "Wallaby",
    Gender: "M",
    Weight: 55,
    Birthday: "2020-11-05",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 5,
    Enclosure: enclosures[4],
  },
  {
    Animal_ID: 49,
    Animal_Name: "Skippy",
    Species: "Wallaby",
    Gender: "F",
    Weight: 45,
    Birthday: "2021-06-20",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 5,
    Enclosure: enclosures[4],
  },

  // Enclosure 6 - Tropical Rainforest (6 animals)
  {
    Animal_ID: 3,
    Animal_Name: "Splash",
    Species: "Sloth",
    Gender: "M",
    Weight: 12,
    Birthday: "2019-03-17",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 6,
    Enclosure: enclosures[5],
  },
  {
    Animal_ID: 50,
    Animal_Name: "Rio",
    Species: "Macaw",
    Gender: "M",
    Weight: 2.2,
    Birthday: "2018-07-22",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 6,
    Enclosure: enclosures[5],
  },
  {
    Animal_ID: 51,
    Animal_Name: "Carmen",
    Species: "Toucan",
    Gender: "F",
    Weight: 1.1,
    Birthday: "2020-02-14",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 6,
    Enclosure: enclosures[5],
  },
  {
    Animal_ID: 52,
    Animal_Name: "Kermit",
    Species: "Poison Dart Frog",
    Gender: "M",
    Weight: 0.02,
    Birthday: "2021-09-05",
    Health_Status: "Excellent",
    Is_Vaccinated: false,
    Enclosure_ID: 6,
    Enclosure: enclosures[5],
  },
  {
    Animal_ID: 53,
    Animal_Name: "Mango",
    Species: "Tree Frog",
    Gender: "F",
    Weight: 0.03,
    Birthday: "2022-01-10",
    Health_Status: "Good",
    Is_Vaccinated: false,
    Enclosure_ID: 6,
    Enclosure: enclosures[5],
  },
  {
    Animal_ID: 54,
    Animal_Name: "Samba",
    Species: "Spider Monkey",
    Gender: "F",
    Weight: 18,
    Birthday: "2017-12-18",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 6,
    Enclosure: enclosures[5],
  },

  // Enclosure 7 - Bird Sanctuary (6 animals)
  {
    Animal_ID: 55,
    Animal_Name: "Pinky",
    Species: "Flamingo",
    Gender: "F",
    Weight: 7,
    Birthday: "2016-04-12",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 7,
    Enclosure: enclosures[6],
  },
  {
    Animal_ID: 56,
    Animal_Name: "Coral",
    Species: "Flamingo",
    Gender: "F",
    Weight: 6.5,
    Birthday: "2017-06-08",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 7,
    Enclosure: enclosures[6],
  },
  {
    Animal_ID: 57,
    Animal_Name: "Phoenix",
    Species: "Flamingo",
    Gender: "M",
    Weight: 7.8,
    Birthday: "2015-09-20",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 7,
    Enclosure: enclosures[6],
  },
  {
    Animal_ID: 58,
    Animal_Name: "Eagle Eye",
    Species: "Bald Eagle",
    Gender: "M",
    Weight: 12,
    Birthday: "2014-11-15",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 7,
    Enclosure: enclosures[6],
  },
  {
    Animal_ID: 59,
    Animal_Name: "Sky",
    Species: "Bald Eagle",
    Gender: "F",
    Weight: 10.5,
    Birthday: "2016-03-25",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 7,
    Enclosure: enclosures[6],
  },
  {
    Animal_ID: 60,
    Animal_Name: "Kiwi",
    Species: "Parrot",
    Gender: "M",
    Weight: 0.8,
    Birthday: "2019-08-10",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 7,
    Enclosure: enclosures[6],
  },

  // Enclosure 8 - North American Wilderness (7 animals)
  {
    Animal_ID: 6,
    Animal_Name: "Koda",
    Species: "Grizzly Bear",
    Gender: "M",
    Weight: 600,
    Birthday: "2016-04-22",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
  },
  {
    Animal_ID: 23,
    Animal_Name: "Bruno",
    Species: "Grizzly Bear",
    Gender: "M",
    Weight: 680,
    Birthday: "2014-10-15",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
  },
  {
    Animal_ID: 24,
    Animal_Name: "Honey",
    Species: "Grizzly Bear",
    Gender: "F",
    Weight: 450,
    Birthday: "2017-06-30",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
  },
  {
    Animal_ID: 61,
    Animal_Name: "Wolfie",
    Species: "Gray Wolf",
    Gender: "M",
    Weight: 110,
    Birthday: "2018-01-15",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
  },
  {
    Animal_ID: 62,
    Animal_Name: "Luna Wolf",
    Species: "Gray Wolf",
    Gender: "F",
    Weight: 85,
    Birthday: "2019-05-20",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
  },
  {
    Animal_ID: 63,
    Animal_Name: "Moose",
    Species: "Elk",
    Gender: "M",
    Weight: 850,
    Birthday: "2015-10-10",
    Health_Status: "Good",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
  },
  {
    Animal_ID: 64,
    Animal_Name: "Daisy",
    Species: "Elk",
    Gender: "F",
    Weight: 550,
    Birthday: "2017-07-25",
    Health_Status: "Excellent",
    Is_Vaccinated: true,
    Enclosure_ID: 8,
    Enclosure: enclosures[7],
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

// Vet Visits
export const vetVisits = [
  {
    Visit_ID: 1,
    Animal_ID: 1,
    Employee_ID: 101,
    Visit_Date: "2025-10-12 09:00:00",
    Diagnosis: "Routine checkup - healthy",
    Treatment: "Vitamin supplement administered",
    Animal: animals.find((a) => a.Animal_ID === 1),
  },
  {
    Visit_ID: 2,
    Animal_ID: 2,
    Employee_ID: 101,
    Visit_Date: "2025-10-10 14:00:00",
    Diagnosis: "Dental examination",
    Treatment: "Dental cleaning performed under sedation",
    Animal: animals.find((a) => a.Animal_ID === 2),
  },
  {
    Visit_ID: 3,
    Animal_ID: 3,
    Employee_ID: 101,
    Visit_Date: "2025-10-08 10:30:00",
    Diagnosis: "Preventative care",
    Treatment: "B12 injection",
    Animal: animals.find((a) => a.Animal_ID === 3),
  },
];

// Animal Care Logs
export const animalCareLogs = [
  {
    Log_ID: 1,
    Animal_ID: 11,
    Employee_ID: 204,
    Log_Date: "2025-10-14 08:00:00",
    Activity: "Morning Feeding",
    Notes: "Fed hay and fresh vegetables. Good appetite.",
    Animal: animals.find((a) => a.Animal_ID === 11),
  },
  {
    Log_ID: 2,
    Animal_ID: 6,
    Employee_ID: 204,
    Log_Date: "2025-10-13 11:00:00",
    Activity: "Enclosure Enrichment",
    Notes: "Added new climbing structure. Bear showed immediate interest.",
    Animal: animals.find((a) => a.Animal_ID === 6),
  },
  {
    Log_ID: 3,
    Animal_ID: 65,
    Employee_ID: 204,
    Log_Date: "2025-10-13 15:00:00",
    Activity: "Pool Maintenance",
    Notes: "Cleaned and refilled pool. Temperature adjusted to 75°F.",
    Animal: animals.find((a) => a.Animal_ID === 65),
  },
];

// Feeding Schedule
export const feedingSchedules = [
  {
    Feeding_ID: 1,
    Animal_ID: 3,
    Food: "Leaves and Fruits",
    Feeding_Time: "2025-10-14 09:00:00",
  },
  {
    Feeding_ID: 2,
    Animal_ID: 1,
    Food: "Hay and Vegetables",
    Feeding_Time: "2025-10-14 11:30:00",
  },
  {
    Feeding_ID: 3,
    Animal_ID: 2,
    Food: "Raw Meat",
    Feeding_Time: "2025-10-14 13:00:00",
  },
  {
    Feeding_ID: 4,
    Animal_ID: 65,
    Food: "Fish and Seaweed",
    Feeding_Time: "2025-10-14 15:30:00",
  },
  {
    Feeding_ID: 5,
    Animal_ID: 11,
    Food: "Hay and Grains",
    Feeding_Time: "2025-10-14 16:45:00",
  },
];

// Memberships (Customer_ID is primary key)
export const memberships = [
  {
    Customer_ID: 1,
    Price: 149.99,
    Start_Date: "2025-01-01",
    End_Date: "2025-12-31",
    Membership_Status: true,
    Last_Renewal_Date: "2025-01-01",
    Total_Renewals: 0,
  },
];

// Purchases (ordered chronologically: #1 = oldest, #9 = newest)
export const purchases = [
  {
    Purchase_ID: 1,
    Total_Amount: 149.99,
    Payment_Method: "Card",
    Purchase_Date: "2025-01-01 10:00:00", // Oldest - membership purchase
    Customer_ID: 1,
    Membership_ID: 1,
  },
  {
    Purchase_ID: 2,
    Total_Amount: 156.8,
    Payment_Method: "Card",
    Purchase_Date: "2025-08-20 14:00:00", // 65 days ago (within year)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 3,
    Total_Amount: 45.2,
    Payment_Method: "Card",
    Purchase_Date: "2025-09-25 12:15:00", // 29 days ago (within month)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 4,
    Total_Amount: 98.75,
    Payment_Method: "Card",
    Purchase_Date: "2025-10-05 15:00:00", // 19 days ago (within month)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 5,
    Total_Amount: 67.45,
    Payment_Method: "Cash",
    Purchase_Date: "2025-10-10 10:30:00", // 14 days ago (within month)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 6,
    Total_Amount: 34.99,
    Payment_Method: "Card",
    Purchase_Date: "2025-10-20 13:20:00", // 4 days ago (within week)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 7,
    Total_Amount: 124.5,
    Payment_Method: "Card",
    Purchase_Date: "2025-10-22 16:45:00", // 2 days ago (within week)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 8,
    Total_Amount: 109.95,
    Payment_Method: "Cash",
    Purchase_Date: "2025-10-24 08:00:00", // Today (early morning)
    Customer_ID: 1,
    Membership_ID: null,
  },
  {
    Purchase_ID: 9,
    Total_Amount: 107.94,
    Payment_Method: "Card",
    Purchase_Date: "2025-10-24 09:30:00", // Today (most recent)
    Customer_ID: 1,
    Membership_ID: null,
  },
];

// Tickets (updated to match DB schema - no Valid_Date or Is_Used, has Quantity)
export const tickets = [
  {
    Ticket_ID: 1,
    Ticket_Type: "Adult",
    Price: 29.99,
    Purchase_ID: 1,
    Quantity: 1,
  },
  {
    Ticket_ID: 2,
    Ticket_Type: "Senior",
    Price: 24.99,
    Purchase_ID: 1,
    Quantity: 1,
  },
  {
    Ticket_ID: 3,
    Ticket_Type: "Adult",
    Price: 29.99,
    Purchase_ID: 9,
    Quantity: 2,
  },
  {
    Ticket_ID: 4,
    Ticket_Type: "Child",
    Price: 14.99,
    Purchase_ID: 9,
    Quantity: 2,
  },
  {
    Ticket_ID: 5,
    Ticket_Type: "Senior",
    Price: 24.99,
    Purchase_ID: 8,
    Quantity: 1,
  },
  {
    Ticket_ID: 6,
    Ticket_Type: "Student",
    Price: 19.99,
    Purchase_ID: 8,
    Quantity: 2,
  },
];

// Purchase Items (junction table linking purchases to gift shop items)
export const purchaseItems = [
  { Purchase_ID: 1, Item_ID: 9000, Quantity: 1, Unit_Price: 149.99 }, // Purchase #1: Membership purchase
  { Purchase_ID: 2, Item_ID: 3, Quantity: 2, Unit_Price: 29.99 }, // Purchase #2: 2x Animal Encyclopedia
  { Purchase_ID: 2, Item_ID: 1, Quantity: 2, Unit_Price: 24.99 }, // Purchase #2: 2x Plush Elephant
  { Purchase_ID: 2, Item_ID: 6, Quantity: 1, Unit_Price: 22.99 }, // Purchase #2: 1x Plush Tiger
  { Purchase_ID: 3, Item_ID: 1, Quantity: 1, Unit_Price: 24.99 }, // Purchase #3: 1x Plush Elephant
  { Purchase_ID: 3, Item_ID: 5, Quantity: 1, Unit_Price: 16.99 }, // Purchase #3: 1x Safari Hat
  { Purchase_ID: 4, Item_ID: 7, Quantity: 2, Unit_Price: 34.99 }, // Purchase #4: 2x Binoculars
  { Purchase_ID: 4, Item_ID: 2, Quantity: 1, Unit_Price: 19.99 }, // Purchase #4: 1x Zoo T-Shirt
  { Purchase_ID: 5, Item_ID: 3, Quantity: 1, Unit_Price: 29.99 }, // Purchase #5: 1x Animal Encyclopedia
  { Purchase_ID: 5, Item_ID: 6, Quantity: 1, Unit_Price: 22.99 }, // Purchase #5: 1x Plush Tiger
  { Purchase_ID: 5, Item_ID: 4, Quantity: 1, Unit_Price: 14.99 }, // Purchase #5: 1x Water Bottle
  { Purchase_ID: 6, Item_ID: 5, Quantity: 2, Unit_Price: 16.99 }, // Purchase #6: 2x Safari Hat
  { Purchase_ID: 7, Item_ID: 1, Quantity: 2, Unit_Price: 24.99 }, // Purchase #7: 2x Plush Elephant
  { Purchase_ID: 7, Item_ID: 2, Quantity: 3, Unit_Price: 19.99 }, // Purchase #7: 3x Zoo T-Shirt
  { Purchase_ID: 7, Item_ID: 4, Quantity: 1, Unit_Price: 14.99 }, // Purchase #7: 1x Water Bottle
  { Purchase_ID: 8, Item_ID: 1, Quantity: 1, Unit_Price: 24.99 }, // Purchase #8: 1x Plush Elephant
  { Purchase_ID: 8, Item_ID: 2, Quantity: 1, Unit_Price: 19.99 }, // Purchase #8: 1x Zoo T-Shirt
];

// Purchase Concession Items (junction table linking purchases to concession items)
export const purchaseConcessionItems = [
  { Purchase_ID: 3, Concession_Item_ID: 6, Quantity: 3, Unit_Price: 5.99 }, // Purchase #3: 3x Vanilla Ice Cream Cone
  { Purchase_ID: 3, Concession_Item_ID: 9, Quantity: 2, Unit_Price: 4.99 }, // Purchase #3: 2x Frozen Lemonade
  { Purchase_ID: 6, Concession_Item_ID: 1, Quantity: 2, Unit_Price: 12.99 }, // Purchase #6: 2x Classic Cheeseburger
  { Purchase_ID: 6, Concession_Item_ID: 4, Quantity: 1, Unit_Price: 4.99 }, // Purchase #6: 1x French Fries
  { Purchase_ID: 9, Concession_Item_ID: 1, Quantity: 1, Unit_Price: 12.99 }, // Purchase #9: 1x Classic Cheeseburger
  { Purchase_ID: 9, Concession_Item_ID: 4, Quantity: 1, Unit_Price: 4.99 }, // Purchase #9: 1x French Fries
];

// Helper function to get employee job title
export const getEmployeeRole = (employee) => {
  return employee.Job_Title?.Title || "Employee";
};

// Helper function to check if employee is admin
export const isAdmin = (employee) => {
  return employee.Job_Title?.Title === "Administrator";
};

// Helper function to get customer membership
export const getCustomerMembership = (customerId) => {
  return (
    memberships.find(
      (m) => m.Customer_ID === customerId && m.Membership_Status
    ) || null
  );
};

// Helper function to get customer-specific purchase number (incremental per customer)
export const getCustomerPurchaseNumber = (
  customerId,
  purchaseId,
  purchasesArray = purchases
) => {
  const customerPurchases = purchasesArray
    .filter((p) => p.Customer_ID === customerId)
    .sort(
      (a, b) =>
        new Date(a.Purchase_Date).getTime() -
        new Date(b.Purchase_Date).getTime()
    );

  const index = customerPurchases.findIndex(
    (p) => p.Purchase_ID === purchaseId
  );
  return index !== -1 ? index + 1 : customerPurchases.length + 1;
};

// Animal Management Functions
export const addAnimal = (animal) => {
  const newId = Math.max(...animals.map((a) => a.Animal_ID), 0) + 1;
  const enclosure = enclosures.find(
    (e) => e.Enclosure_ID === animal.Enclosure_ID
  );
  const newAnimal = {
    ...animal,
    Animal_ID: newId,
    Enclosure: enclosure,
  };
  animals.push(newAnimal);
  return newAnimal;
};

export const removeAnimal = (animalId) => {
  const index = animals.findIndex((a) => a.Animal_ID === animalId);
  if (index !== -1) {
    animals.splice(index, 1);
    return true;
  }
  return false;
};

export const getAnimals = () => animals;
