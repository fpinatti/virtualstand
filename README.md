# VirtualStand

VirtualStand is a mobile application for managing board game collections, featuring an interactive 3D virtual shelf, BoardGameGeek (BGG) bidirectional synchronization, offline rulebook reader, card sleeve inventory tracker, and personal ratings.

## Architectural Vision & Stack

- **Framework**: React Native + Expo + TypeScript (Strict Mode)
- **3D Engine**: `@react-three/fiber/native` + `three` + `expo-gl`
- **Gestures & Animations**: `react-native-gesture-handler` + `react-native-reanimated`
- **Database & Offline-First**: `expo-sqlite` + `Drizzle ORM`
- **Rulebook Reader**: `expo-file-system` + `react-native-pdf`
- **External Integration**: BGG XMLAPI2 with resilient 202 retry polling and community sleeve dataset mapping

## Project Governance

This project is governed by the principles and quality standards codified in the [VirtualStand Constitution](.specify/memory/constitution.md). All specifications, plans, and implementations must adhere to these non-negotiable architectural invariants.
