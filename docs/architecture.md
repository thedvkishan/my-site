# TetherSwap Zone: Architectural Overview (Vercel + Firebase)

This document outlines the roles of the various technologies integrated into the platform.

## 1. Vercel
**Role: Managed Next.js Runtime**
- **Hosting & Deployment**: Provides the global edge network for hosting the Next.js 15 frontend.
- **Serverless Functions**: Handles dynamic routing and any server-side logic required by the App Router.
- **Environment Management**: Manages project secrets and Firebase configuration keys.

## 2. Firebase Firestore
**Role: Real-time Institutional Ledger**
- **Data Persistence**: Stores user profiles, buy/sell orders, and the permanent administrative audit trail.
- **Real-time Sync**: Powers the "Activity Terminal" (notifications), allowing users to see balance updates and order status changes instantly via the Client SDK.
- **Security Rules**: Enforces fine-grained access control directly at the database level.

## 3. Firebase Authentication
**Role: Identity & Access Management**
- **Secure Access**: Manages login protocols for both institutional clients and administrators.
- **Peer Provisioning**: Enables the "Sub-Account" feature where existing users can provision new members using an isolated client-side auth protocol.

## 4. Next.js 15
**Role: Frontend Framework**
- **App Router**: Uses modern routing for high-performance navigation between trading terminals.
- **Optimized UI**: Leverages React components with ShadCN UI for an institutional-grade experience.

## 5. Genkit
**Role: AI Orchestration**
- **Institutional Auditing**: Integrated using the Genkit SDK to perform auditing and support tasks.
