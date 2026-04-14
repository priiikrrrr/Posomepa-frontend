# PosomePa Frontend

Mobile app for PosomePa - A property rental platform in India.

## Tech Stack

- **Framework:** React Native (Expo)
- **Navigation:** Expo Router
- **State Management:** React Query (TanStack Query)
- **Styling:** Tailwind CSS
- **Maps:** OpenStreetMap (react-native-webview)
- **Push Notifications:** Firebase Cloud Messaging
- **Authentication:** Firebase Auth

## Features

- User authentication (email/password, Google, OTP)
- Browse properties with AI-powered search
- Filter by category, price, amenities, location
- View property details with images and map
- Book properties with Razorpay payment
- Chat with property hosts
- Host dashboard for managing listings
- View and manage bookings
- Leave reviews and ratings
- Dark mode support
- GPS location for property listings

## Project Structure

```
app/                    # Expo Router pages
├── (auth)/            # Auth screens (login, register, OTP)
├── (tabs)/            # Tab navigation (home, search, bookings, profile)
├── admin/             # Admin screens
├── booking/           # Booking flow
├── host/              # Host dashboard
├── profile/           # Profile screens
├── space/             # Property detail screens
└── terms.js, privacy.js, etc.  # Legal pages

src/
├── api/              # API client
├── components/       # Reusable components
├── context/          # React contexts (auth, theme)
├── services/         # Firebase services
└── utils/            # Utilities and styles
```

## Setup

```bash
npm install
npx expo start
```

## Build APK

```bash
npm run build:android
```

For production release:
```bash
cd android
./gradlew assembleRelease
```

## Environment

Update `src/api/client.js` with your production backend URL.

## License

MIT
