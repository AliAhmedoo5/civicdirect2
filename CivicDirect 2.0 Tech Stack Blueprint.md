# **CivicDirect 2.0: Tech Stack Architecture**

To ensure rapid AI-assisted development and a bulletproof architecture, we are standardizing on a TypeScript/React ecosystem monorepo.

## **1\. Authentication: Clerk**

* **Why:** Drop-in UI components for React and Expo. Instant setup for social logins, SMS OTP, and session management.  
* **Integration:** Clerk will act as the identity provider. It will pass a custom JWT to Supabase so our database knows exactly who is reading/writing data.

## **2\. Database & Backend: Supabase**

We are using Supabase strictly as our PostgreSQL database and API layer.

* **Relational Integrity:** Strict tables for NGOs, Donors, and Transactions to prevent data overlap.  
* **JSONB Support:** Perfect for the flexible details column needed for different request types (Medical, Education, etc.).  
* **Security:** Row Level Security (RLS) policies will parse the Clerk JWT to ensure users only access their own data.

## **3\. Web Admin (The Hub): Next.js \+ Tailwind CSS**

The central brain needs to be fast, secure, and visually crisp.

* **Framework:** Next.js (App Router, React).  
* **Styling & UI:** Tailwind CSS \+ Shadcn UI (dark mode, 8px grid).

## **4\. Mobile Apps (The Spokes): React Native \+ Expo**

For the NGO App and Donor App.

* **Unified Language:** TypeScript allows the AI to share data types between Web and Mobile effortlessly.  
* **Routing:** Expo Router (file-based routing, which is much easier for AI to manage than React Navigation).  
* **Styling:** NativeWind (Tailwind for React Native).

## **5\. State Management & Data Fetching**

* **Server State:** TanStack Query (React Query). Handles fetching, caching, and updating from Supabase automatically.  
* **Local State:** Zustand. For lightweight global state (e.g., holding form data during a multi-step upload).