# Session Memory: CivicDirect

## Work Completed
1. **Admin Dashboard Enhancements (Next.js)**
   - Enhanced the NGO Verification Drawer to properly map and parse dynamic `details` payload from the database.
   - Added a "Rejection Reason" text area for the admin when rejecting a verification request or campaign request.
   - Fixed rendering crashes when iterating over unknown JSON properties.

2. **NGO App Enhancements (Expo / React Native)**
   - Refactored the `CampaignCard` UI to match a high-quality reference design, implementing full cover images, category badges, dynamic target/raised progress bars, and bottom action rows.
   - Created a segmented control tab view in the "Requests" screen to filter by `pending`, `approved`, and `rejected`.
   - Added a dedicated "View Details" modal (`request-details.tsx`) to pull full campaign details from the database and display them dynamically.
   - Added tab bar icons (`Ionicons`) for the Dashboard and Requests tabs.
   - Implemented a custom Number formatter to safely handle comma-separated values, bypassing a bug in Hermes where `Intl` is not shipped leading to `.toLocaleString()` crashes.

## Critical Error Handlings & Bug Fixes
- **Expo Router & NativeWind v4 Crash Loop:** 
  - **Symptoms:** The app fatally crashed with a `Maximum call stack size exceeded` (or `replace` loop) and Expo Router threw a `Couldn't find a navigation context` ErrorBoundary fallback when switching between tabs in the `requests` screen.
  - **Root Cause:** NativeWind v4's `printUpgradeWarning` function was being triggered because `space-y-4` and dynamic color classes (like `shadow-lg`) were being dynamically added/removed when mounting different arrays of children or changing tab state. When `printUpgradeWarning` attempted to `stringify()` the React Fiber nodes to print the warning to the console, it crashed due to the massive depth of the React Element tree.
  - **Resolution:** Removed NativeWind's interception from dynamically changing components. Bypassed `space-y-4` by using standard `mb-5` margins on the children, and replaced dynamic tab class strings with standard React Native inline `style={{ backgroundColor: ... }}` properties. Also renamed the route file (`requests.tsx` -> `my-requests.tsx`) to force Expo Metro bundler to drop its corrupted route cache.

## Next Steps / Future Work
- Implement the "Edit Campaign" functionality on the NGO app.
- Wire up the "0 Backers" stat to the actual donor contributions table.
- Build the Donor App UI for browsing and donating to verified campaigns.
- Connect the Supabase Edge Functions to handle the actual Stripe/Payment processing logic.
