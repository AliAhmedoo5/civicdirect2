# Session 3: Core Features & Bug Fixes

## Work Completed
1. **NGO Document Verification (NGO App)**
   - Integrated `expo-document-picker` for selecting registration certificates (PDFs).
   - Added platform-specific handling: `FileReader` for Web and `expo-file-system/legacy` for Native (Android/iOS) to read files as Base64.
   - Uploaded documents to Supabase Storage (`documents` bucket) and saved the public URL to `ngos.verification_document_url`.
   - Fixed a bug where logged-in NGOs with missing records were getting stuck on the dashboard; they are now correctly redirected back to `/onboarding`.

2. **Admin Verification & Moderation (Web Admin)**
   - **NGO Document Review**: Added a "View PDF" download button on the NGO management page to allow admins to verify NGO credentials.
   - **Escrow Pipeline**: Integrated a slide-out `Sheet` modal allowing admins to view full details (proof images, requested vs raised amounts) of fully-funded campaigns before processing disbursal.
   - **Urgency Filtering**: Implemented an urgency filter dropdown on the Pending Requests page, allowing admins to prioritize `High` and `Critical` campaigns.

3. **Donor App Enhancements**
   - Implemented dynamic UI for `urgency_level` using custom glowing badges (Yellow for High, Red for Critical).
   - Implemented a countdown calculation (`daysLeft`) based on the campaign's `deadline` and displayed it prominently on campaign cards and detail screens.
   - Fixed Supabase Realtime channel collision errors by adding dynamic timestamps to channel names across all applications.

## Next Steps / Pending
- Process Custom Donation Input logic in Donor App (if required in the future).
- Hook up the final "Process Disbursal" action in the Escrow Pipeline to move funds.
- Set up Stripe/Payment Gateway for the Donor App checkout.
