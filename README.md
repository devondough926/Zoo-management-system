# 🦁 WildWood Zoo Management System

**Created By:** Tuan Hoang, Devon Do, Muhammad Bilal, Olamide Iluku-Ayoola, Cole Jaramillo

## 📋 Project Overview

This web application is a comprehensive management system for WildWood Zoo. The system handles various aspects of zoo operations including animal care, habitat management, feeding schedules, veterinary records, visitor ticketing, merchandise sales, and weather-based exhibit closures. The platform provides role-specific dashboards for administrators, zookeepers, veterinarians, and customers.

---

## 💾 Database Details

The database uses **MySQL** and includes the following key entities:

- **Animals**: Profiles, health records, feeding schedules, and vaccination tracking
- **Exhibits**: Habitat details, capacity, maintenance schedules, and closure status
- **Employees**: Staff information, job roles, and zone assignments
- **Customers**: Visitor profiles, membership management, and purchase history
- **Tickets & Memberships**: Ticketing system with membership discounts
- **Merchandise & Concessions**: Inventory management with automated tracking
- **Weather Conditions**: Weather alerts triggering exhibit closures
- **Activity Notifications**: Live tracking of exhibit activities and events

---

## 🚀 Installation Instructions

### Prerequisites

- **Node.js** (v14 or higher)
- **MySQL Server** (v8.0 or higher)
- **npm** package manager
- **Azure Blob Storage** account (for image hosting)

### Backend Setup

1. Navigate to the Backend directory:

   ```bash
   cd zoo-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:

   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173

   # Database Configuration
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=zoodb

   # Azure Storage (for images)
   AZURE_STORAGE_CONNECTION_STRING=your-connection-string
   AZURE_STORAGE_CONTAINER_NAME=zoo-images

   # JWT Secret
   JWT_SECRET=your-secret-key
   ```

4. Import the database:

   ```bash
   # Use the provided SQL dump file
   mysql -u your-username -p zoodb < Dump20251124.sql
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the Frontend directory:

   ```bash
   cd zoo-management
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

---

## 👥 User Roles and Access

The application supports six distinct user roles:

### 1. **Administrator**

- Full system access and management
- Manage all animals, exhibits, and employees
- View comprehensive analytics and reports
- Configure pricing and system settings
- Assign supervisors to zoo zones
- Control weather alerts and exhibit closures

### 2. **Zookeeper**

- Animal feeding management and tracking
- Habitat cleaning schedules (7-day cycles)
- Real-time feeding status dashboard
- Activity logging for animal care
- Notifications for new animals and overdue tasks
- Zone-specific animal oversight

### 3. **Veterinarian**

- Animal health records and status tracking
- Vaccination management and scheduling
- Medical log entries and treatment notes
- Health status updates (Excellent, Good, Fair, Critical)
- Animal profile management

### 4. **Customer/Visitor**

- Create accounts and log in
- Purchase tickets and memberships
- Browse exhibits and animals
- View purchase history
- Access membership benefits (10% discount on food and giftshop items)
- Real-time exhibit status and activity schedules

### 5-6. **Gift Shop & Concession Workers**

- Inventory management
- Process sales transactions
- View merchandise and food items
- Apply membership discounts at checkout

---

## 🔒 Semantic Constraints & Business Rules

### Data Validation

- Employee IDs and customer emails must be unique
- Animal weights and exhibit capacities must be positive values
- Membership dates must be valid (end date after start date)

### Referential Integrity

- All purchases must reference valid customers
- Animal records must reference existing exhibits
- Feeding logs must reference valid animals and employees

### Business Logic

- **Membership Discounts**: 10% discount automatically applied on all food + giftshop items
- **Weather-Based Closures**:
  - Rain/Storm/High Wind → Outdoor and Hybrid exhibits closed
  - Snow → Outdoor exhibits closed
  - Extreme Heat/Cold → All exhibits closed
- **Feeding Schedules**:
  - Daily feeders: Multiple meals per day tracking
  - Weekly feeders: 7-day interval tracking
  - Priority system: Empty > Partial > Fed
- **Cleaning Cycles**: 7-day automatic tracking with skip-day(for demonstrations) functionality

### Database Triggers (semantic triggers)

- **Membership Purchase**: Automatically creates membership record and applies discount on adding items to cart
- **Weather Activation**: Triggers exhibit closures based on weather type
- **Activity Updates**: Real-time updates to active exhibit activities

## 📊 Database Views & Reports

### Zookeeper Views

- **`needs_feeding`**: Real-time feeding status with priority levels
- **`feeding_history`**: Complete feeding log with employee tracking
- **`cleaning_card_data`**: 7-day cycle tracking with progress percentages
- **`zookeeper_notifications`**: New animals and maintenance alerts

### Veterinary Views

- Animal health dashboard with vaccination status
- Medical history tracking by animal
- Health status change notifications

### Queries & Reports

**Revenue & Financial Analysis Report:**

- Revenue tracking across all sources (tickets, membership, gift shop, food) with date range analysis
- Visitor segmentation, transaction filtering, and top contributor identification
- Visual analytics: daily trends, revenue distribution, and comparison charts
- Detailed transaction history with advanced sorting and column controls

**Visitor Behavior & Sales Performance Report:**

- Customer journey analysis with time-based insights and purchase patterns
- Product performance tracking with conversion metrics
- Visual analytics: peak hours, category sales, transaction value trends
- Top-performing products table with revenue and sales metrics

**Animal Health Report:**

- Comprehensive animal health analytics with filtering by zone, enclosure, species, demographics, vaccination status, and date range
- Visual analysis: health status distribution, species population, age/weight trends
- Detailed sortable animal health records tabLE

---

## 🛠️ Technologies Used

**Frontend:**

- React, VITE, JavaScript, HTML, CSS

**Backend:**

- Node.js

**Database:**

- MySQL 8.0

**Hosting:**

- All on Azure

**Hosting URLs:**

- Frontend: https://purple-bush-05566fa10.3.azurestaticapps.net/
- Backend: https://wildwoodzoo-backend-ghhcgwhqf6bsgzhw.centralus-01.azurewebsites.net/api

---
