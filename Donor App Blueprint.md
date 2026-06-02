# **CivicDirect 2.0 \- Donor App (The Output)**

## **1\. Minimum Viable Product (MVP)**

A premium consumer app where donors can discover verified campaigns, load a digital wallet, and make direct micro-donations.

* **Core features:** Clerk Auth, Digital Wallet (Mock Top-ups for MVP), Discovery Feed (only showing active requests), and transaction processing.

## **2\. Product Requirements Document (PRD)**

* **Target Audience:** Everyday philanthropists seeking transparency.  
* **Design Language:** "Fintech Premium." Dark Mode, 8px grid. Glowing neon progress bars (cyan/green) showing funding status. Clean, trustworthy typography.  
* **Key Workflows:**  
  * *Wallet Top-Up:* A UI flow simulating adding funds via EasyPaisa/Bank.  
  * *The Feed:* Scrollable list of verified requests.  
  * *Micro-Donation Modal:* Quick select amounts to deduct from local wallet and apply to campaign.

## **3\. Technical Requirements Plan (TRP)**

* **Framework:** React Native with Expo (Expo Router).  
* **Styling:** NativeWind (Tailwind).  
* **Wallet Logic:** A PaymentService class that mocks payment gateways for now, interacting with a donors table in Supabase.  
* **Constraint:** App *only* queries the requests table where status \= 'active'.

## **4\. App Flow**

1. **Auth:** Donor logs in/signs up (Clerk).  
2. **Home Screen:** Shows current Wallet Balance at the top. Below is the Feed of active campaigns.  
3. **Top Up:** User taps "Top Up", simulates adding Rs. 5000\. Balance updates.  
4. **Donate:** User taps a campaign, enters Rs. 1000, taps "Donate".  
5. **Processing:** Wallet balance drops by 1000\. Campaign raised\_amount increases by 1000\.

## **5\. Development Workflow & Hand-offs (How to Connect)**

* **When to build this:** Third. This is Phase 4\.  
* **The Connection Goal:** To complete the ecosystem loop by pushing a campaign over its target amount and triggering the database state machine.  
* **The End-to-End Test (The Grand Finale):**  
  1. Open Web Admin, NGO App, and Donor App simultaneously.  
  2. Ensure the campaign you approved in Phase 3 is visible in the Donor App Feed.  
  3. In the Donor App, donate the remaining amount needed to hit 100% of the target\_amount.  
  4. **Watch the magic:** The campaign should instantly disappear from the Donor App Feed (DB trigger changed status to fully\_funded).  
  5. Look at the Web Admin: The campaign should now be in the "Ready for Disbursal" tab.  
  6. Look at the NGO App: The campaign status should show "Goal Reached \- Awaiting Escrow".  
* **Success:** If this works, Phase 4 is complete. Commit to GitHub. The core loop is finished\!