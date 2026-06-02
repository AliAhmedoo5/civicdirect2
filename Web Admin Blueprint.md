# **CivicDirect 2.0 \- Web Admin (The Hub)**

## **1\. Minimum Viable Product (MVP)**

The central control panel strictly for platform administrators. Its sole purpose is to act as the gatekeeper for trust and data integrity.

* **Core features:** Secure login (Clerk), view incoming NGO requests, verify/reject requests (reviewing OCR scans and JSON payload data), and manage the escrow state machine (disbursing funds once a campaign hits 100%).

## **2\. Product Requirements Document (PRD)**

* **Target Audience:** CivicDirect internal operations and compliance teams.  
* **Design Language:** Dark Mode (\#0B0F19 background), strictly enforced 8px grid, high data density, "Tactile Modern" aesthetic. Minimalist 3D isometric icons for modules. High-contrast neon accents for actionable buttons (Approve/Reject).  
* **Key Workflows:**  
  * *Verification Engine:* Render dynamic JSON payloads based on request\_type (e.g., showing Student ID for education, Hospital Name for medical) alongside the uploaded proof image.  
  * *Escrow Management:* Automatically filter and group campaigns that have reached the fully\_funded status for final payout review.

## **3\. Technical Requirements Plan (TRP)**

* **Framework:** Next.js (App Router) using React & TypeScript.  
* **Styling:** Tailwind CSS \+ Shadcn UI.  
* **Data Fetching:** TanStack Query (React Query) connected to Supabase SDK.  
* **Architecture Rule:** Use a "Component Map" pattern (DynamicPayloadRenderer) to render verification drawer details based on request\_type.

## **4\. App Flow**

1. **Auth:** Admin logs in via Clerk.  
2. **Dashboard/Inbox:** Lands on the Pending Requests data table.  
3. **Verification Slide-out:** Admin clicks a row. A side drawer opens showing standard data (Amount, NGO), dynamic JSON data, and the document scan image.  
4. **Decision:** Admin clicks "Verify & Publish" (changes DB status to active) or "Reject" (status rejected).  
5. **Escrow Pipeline:** Admin navigates to the "Ready for Disbursal" tab to review fully\_funded campaigns.

## **5\. Development Workflow & Hand-offs (How to Connect)**

* **When to build this:** First. This is Phase 2 (after DB setup).  
* **How to build it standalone:** Manually insert 3 dummy rows into Supabase (one pending, one active, one fully\_funded) using the SQL editor. Build the Next.js UI to fetch and display these rows perfectly.  
* **When to PAUSE:** Stop working on the Web Admin once the UI successfully reads the dummy data from Supabase and you can manually change a request status from 'pending' to 'active' via the Admin UI.  
* **The Hand-off:** Leave this running on localhost:3000. Commit code. Switch the IDE context entirely to the ngo\_app\_blueprint.md.