# Verifiey - SMS Verification Service

A Next.js application for reselling DaisySMS services with a custom credit system and admin panel.

## Features

- 🔐 Firebase Authentication (Email/Password)
- 💰 Custom credit system with real-time updates
- 👥 Admin panel for user and credit management
- 🔄 WebSocket for real-time balance updates
- 📊 Transaction history tracking
- 🎨 Modern UI with Tailwind CSS and Open Sans font

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore
- DaisySMS API credentials

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables in `.env.local`:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"

# DaisySMS API
DAISYSMS_API_KEY=your_daisysms_api_key
```

3. Configure Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"
      );
    }
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Admin Access

1. Set user role to "admin" in Firestore
2. Access admin panel at `/admin-login`
3. Admin features:
   - View all users
   - Add/deduct credits
   - View transactions
   - Monitor API balance

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Firebase Authentication & Firestore
- Socket.io for WebSocket
- Tailwind CSS
- React Hot Toast
- SWR for data fetching
- Lucide React for icons
- Open Sans font (Google Fonts)
- DaisySMS API integration
