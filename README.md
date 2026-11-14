# VirtualStand

VirtualStand is a mobile application for managing board game collections, featuring an interactive 3D virtual shelf, BoardGameGeek (BGG) bidirectional synchronization, offline rulebook reader, card sleeve inventory tracker, and personal ratings.

## Architectural Vision & Stack

- **Framework**: React Native + Expo + TypeScript (Strict Mode)
- **3D Engine**: `@react-three/fiber/native` + `three` + `expo-gl`
- **Gestures & Animations**: `react-native-gesture-handler` + `react-native-reanimated`
- **Database & Offline-First**: `expo-sqlite` + `Drizzle ORM`
- **Rulebook Reader**: `expo-file-system` + `react-native-pdf`
- **External Integration**: BGG XMLAPI2 with resilient 202 retry polling and community sleeve dataset mapping

## Development Build & Platform Notes

Because `react-native-pdf` and `react-native-blob-util` contain native code for offline PDF rendering, VirtualStand uses an **Expo Development Build** rather than Expo Go for iOS and Android:

```bash
# Generate native directories locally (not committed) and run on device/emulator
npx expo prebuild --clean
npx expo run:android   # or: npx expo run:ios

# Typecheck & unit/integration tests
npm run typecheck
npm test
```

- **Web limitation**: On web (`npm run web`), collection browsing, 3D shelf, sleeve management, play session logging, and personal ratings work normally; the native PDF rulebook reader displays an informational message (`Leitura de manuais disponível no app iOS/Android`).

## Project Governance

This project is governed by the principles and quality standards codified in the [VirtualStand Constitution](.specify/memory/constitution.md). All specifications, plans, and implementations must adhere to these non-negotiable architectural invariants.
