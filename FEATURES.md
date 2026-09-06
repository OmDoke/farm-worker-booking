# Platform Features and Roles

The Farm Worker Booking platform is designed with a strict role-based architecture. Below is a breakdown of the existing functionality and workflows mapped to each role.

---

## 1. Customer (Farmer)
The customer is the user who needs farm labor.

### Authentication & Profile
- **Login/Registration:** Phone number + OTP authentication.
- **Role Assignment:** Default role upon first login is `customer`.

### Booking Flow
- **Create Booking (`/book`):**
  - Enter farm size in acres.
  - Select required farm tasks (e.g., Pruning, Tying, Harvesting, etc.).
  - Select the scheduled date for the work.
  - The booking is submitted with `status = pending_assignment`.
- **Payment Processing (`/payment/:id`):**
  - Pay via Razorpay (UPI, Card, Netbanking).
  - Cash on Delivery (Admin/Worker confirmation).

### Dashboard (`/dashboard`)
- View a list of all past and upcoming bookings.
- See real-time status of the booking (`Pending Assignment`, `Confirmed`, `Completed`).
- **Worker Visibility:** Once an admin assigns a worker, the customer can view the assigned worker's full name and mobile number to coordinate directly.

---

## 2. Admin (Dispatcher & Manager)
The admin oversees the entire marketplace, managing workers and dispatching jobs.

### Authentication & Profile
- Requires the `admin` role in the database.
- Has a dedicated, secure navigation layout (`/admin`).

### Worker Management (`/admin/workers`)
- **View All Workers:** See a table of all registered workers, including their full name, mobile number, service area, and daily rate.
- **Approval Workflow:** Admins review pending worker profiles and can explicitly click **Approve** or **Reject**. Only approved workers can be assigned to jobs.

### Booking Dispatcher (`/admin/bookings`)
- **Centralized Job List:** Admins view all incoming bookings from customers.
- **Manual Assignment:** For bookings that are `pending_assignment`, the admin clicks "Assign Worker".
- **Dispatching:** A modal allows the admin to select from a list of currently *approved* workers. 
- **Instant Confirmation:** Upon assignment, the booking is moved to `confirmed` status instantly.
- **Automated SMS:** The system immediately triggers an SMS notification to the selected worker with the exact location coordinates and scheduled time.

---

## 3. Worker (Laborer)
The worker provides the labor. Their workflow is highly simplified to accommodate rural tech literacy.

### Authentication & Registration (`/worker/register`)
- **Login:** Phone number + OTP.
- **Registration Profile:** Workers must register by providing:
  - Full Name
  - Service Area (Village/Taluka)
  - Daily Rate (₹)
- **Wait for Approval:** After registration, their profile is `pending_review`. They cannot receive jobs until the Admin approves them.

### Passive Dashboard (`/dashboard`)
- **No Manual Acceptance:** Workers do *not* browse open jobs and do *not* have to click "Accept" or "Decline".
- **Dispatched Jobs Only:** When a worker logs in, they only see jobs that the Admin has already explicitly assigned to them.
- **Job Details:** For assigned jobs, the worker can see the Customer's Name, Customer's Mobile Number, the tasks required, and the Farm Location (so they know exactly where to travel).
- **Completion:** Once the job is done, the worker can click "Mark as Complete" to finalize the booking lifecycle.

---

## Additional System Features
- **i18n Localization:** The UI strings are fully extracted into `mr.json` (Marathi) and `en.json` (English), allowing seamless switching for local users.
- **Audit Logging (Backend):** Critical actions (like assigning a worker or updating a profile) trigger an internal audit log function to maintain a trail of platform events.
- **Notifications Engine:** A wrapper around the MSG91 API handles sending transactional SMS messages (e.g., OTPs, dispatch alerts, payment confirmations).
