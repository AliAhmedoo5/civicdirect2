# **CivicDirect 2.0 \- Project Setup & CLI Skills**

**AI INSTRUCTION:** Use these exact commands and libraries when initializing the project. Do not use outdated packages or hallucinate alternative frameworks.

## **1\. Monorepo Setup (The Roots)**

We are using standard npm/yarn workspaces or just separate folders in a single root directory for simplicity to avoid TurboRepo caching bugs during rapid prototyping.

**Commands to run in root directory:**

mkdir civicdirect-monorepo  
cd civicdirect-monorepo

## **2\. Web Admin (Next.js) Skills**

* **Framework:** Next.js (App Router)  
* **Styling:** Tailwind CSS \+ Shadcn UI  
* **Auth & DB:** Clerk \+ Supabase

**Initialization Commands:**

npx create-next-app@latest web-admin \--typescript \--tailwind \--eslint \--app \--src-dir \--import-alias "@/\*"  
cd web-admin  
npm install @supabase/supabase-js @clerk/nextjs  
npm install @tanstack/react-query zustand  
npx shadcn-ui@latest init

## **3\. NGO & Donor Apps (Expo) Skills**

* **Framework:** React Native \+ Expo Router  
* **Styling:** NativeWind (Tailwind for React Native)  
* **Auth & DB:** Clerk Expo \+ Supabase

**Initialization Commands (Run from root):**

\# Create NGO App  
npx create-expo-app@latest ngo-app \--template expo-template-blank-typescript  
cd ngo-app  
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar  
npm install @supabase/supabase-js @clerk/clerk-expo  
npm install @tanstack/react-query zustand  
\# NativeWind Setup (AI: Follow standard NativeWind v2/v4 setup based on current stable)  
npm install nativewind  
npx expo install react-native-reanimated tailwindcss

\# Create Donor App (Repeat process)  
cd ..  
npx create-expo-app@latest donor-app \--template expo-template-blank-typescript  
\# (Run the same install commands as above for the donor app)

## **4\. Specific Library Skills & Gotchas (AI Take Note)**

* **Supabase Client:** For Expo apps, use react-native-url-polyfill/auto at the top of the entry file, and use AsyncStorage for the Supabase client storage option.  
* **Clerk Expo:** Use expo-secure-store to cache the Clerk JWT token locally.  
* **Shadcn UI:** Generate components as needed (e.g., npx shadcn-ui@latest add table button dialog). Do not build these from scratch.  
* **Camera/OCR (NGO App):** Use npx expo install expo-camera.