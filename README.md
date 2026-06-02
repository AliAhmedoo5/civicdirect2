# CivicDirect 2.0 Monorepo

Welcome to the CivicDirect 2.0 workspace. This monorepo contains the following projects:

1. **`web-admin`**: Next.js App Router admin portal for internal platform operations.
2. **`ngo-app`**: Expo React Native mobile application for NGO field workers.
3. **`donor-app`**: Expo React Native mobile application for donors.

---

## Directory Structure

```
civicdirect2/             <- Monorepo Root
├── web-admin/            <- Next.js Admin Hub
├── ngo-app/              <- Expo NGO Mobile App
├── donor-app/            <- Expo Donor Mobile App
├── .gitignore            <- Workspace Git rules
└── README.md             <- This file
```

---

## Getting Started

### 1. Web Admin (`web-admin`)
Navigate to the Web Admin directory and run the development server:
```bash
cd web-admin
npm run dev
```

### 2. NGO Mobile App (`ngo-app`)
Navigate to the NGO App directory and start Expo:
```bash
cd ngo-app
npx expo start
```

### 3. Donor Mobile App (`donor-app`)
Navigate to the Donor App directory and start Expo:
```bash
cd donor-app
npx expo start
```
