# TetherSwap Zone: Institutional Architecture Overview

This document outlines the roles of the various technologies integrated into the TetherSwap Zone platform.

## 1. Firebase App Hosting
**Role: Managed Institutional Runtime**
- **Managed Next.js 15 Environment**: Provides the secure server-side infrastructure for high-performance trading logic.
- **Dynamic Routing & SSR**: Powers the institutional terminals with optimized page loads and secure Server Actions.
- **Scalable Infrastructure**: Automatically manages Google Cloud resources to handle varying institutional trading volumes.

## 2. Firebase Firestore
**Role: Real-time Institutional Ledger**
- **Data Persistence**: Stores user profiles, buy/sell protocols, and the permanent administrative audit trail.
- **Real-time Sync**: Powers the "Activity Terminal" (notifications), allowing users to see balance updates and order status changes instantly via the Client SDK.
- **Security Rules**: Enforces fine-grained access control directly at the database level.

## 3. Firebase Authentication
**Role: Identity & Access Management**
- **Secure Access**: Manages login protocols for both institutional clients and administrators.
- **Peer Provisioning**: Enables the "Sub-Account" feature where existing users can provision new members using an isolated client-side auth protocol.

## 4. Next.js 15
**Role: Institutional Frontend Framework**
- **App Router**: Uses modern routing for high-performance navigation between trading terminals.
- **Optimized UI**: Leverages React components with ShadCN UI for an institutional-grade experience.

## 5. Genkit
**Role: AI Auditing Orchestration**
- **Institutional Auditing**: Integrated using the Genkit SDK to perform automated auditing and support tasks via the Gemini Pro models.
