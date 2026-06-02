# **CivicDirect 2.0 \- NGO App (The Input)**

## **1\. Minimum Viable Product (MVP)**

A standalone mobile tool for field workers to upload utility bills, medical prescriptions, and other needs, and track their verification/funding status.

* **Core features:** Clerk Auth, Camera scanner for documents, categorized request submission (Utility, Medical, Education), and a status tracking dashboard.

## **2\. Product Requirements Document (PRD)**

* **Target Audience:** Approved NGO field workers operating in low-bandwidth areas.  
* **Design Language:** Tactile Modern, Dark Mode, 8px Grid. High-contrast, chunky action buttons (easy to tap in the field).  
* **Key Workflows:**  
  * *The Action Hub:* Distinct categories for new requests.  
  * *The JSONB Form:* Depending on the category selected, present different form fields (e.g., patient details vs. student details) which get bundled into a JSON payload on submit.  
  * *Local Processing:* Use an on-device camera package to take photos of documents.

## **3\. Technical Requirements Plan (TRP)**

* **Framework:** React Native with Expo (Expo Router for navigation).  
* **Styling:** NativeWind (Tailwind for React Native).  
* **Camera/Upload:** expo-camera combined with reliable image upload to Supabase Storage.  
* **Database Connection:** Supabase Client for React Native.

## **4\. App Flow**

1. **Auth:** NGO Worker logs in (Clerk).  
2. **Dashboard:** Sees list of their past requests and current statuses (pending, active, fully\_funded, disbursed).  
3. **Creation:** Taps "New Request", selects category (e.g., Medical).  
4. **Data Entry:** Fills out specific fields and uses camera to capture proof document.  
5. **Submit:** App pushes image to Supabase Storage, and pushes row to Requests table (with status: pending).

## **5\. Development Workflow & Hand-offs (How to Connect)**

* **When to build this:** Second. This is Phase 3\.  
* **The Connection Goal:** This app must push real data to the Supabase database that the Web Admin (from Phase 2\) is already listening to.  
* **The End-to-End Test:**  
  1. Submit a "Medical" request via the NGO App Simulator.  
  2. Switch to your Web Admin browser window.  
  3. Ensure the request instantly appears in the "Pending" table.  
  4. Click "Approve" in the Web Admin.  
  5. Switch back to the NGO App and ensure the status updates to "Active".  
* **When to PAUSE:** Stop working on the NGO App immediately once the End-to-End test succeeds. Commit to GitHub. Switch context to the donor\_app\_blueprint.md.