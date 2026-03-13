# TetherSwap Zone: Architectural Overview

This document outlines the roles of the various technologies integrated into the platform.

## 1. Firebase App Hosting
**Role: Managed Next.js Runtime**
- **SSR & Server Actions**: Provides the server-side environment for Next.js 15, enabling dynamic rendering and secure server-side logic.
- **Automated Deployment**: Manages the underlying Cloud Run and Cloud Build resources for a seamless CI/CD pipeline.
- **Secret Management**: Handles environment variables and sensitive configuration data securely.

## 2. Firebase Firestore
**Role: Real-time Institutional Ledger**
- **Data Persistence**: Stores user profiles, buy/sell orders, and the permanent administrative audit trail.
- **Real-time Sync**: Powers the "Activity Terminal" (notifications), allowing users to see balance updates and order status changes instantly.
- **Security Rules**: Enforces fine-grained access control, ensuring institutional users can only access their own data while admins maintain oversight.

## 3. Firebase Authentication
**Role: Identity & Access Management**
- **Secure Access**: Manages login protocols for both institutional clients and administrators.
- **Peer Provisioning**: Enables the "Sub-Account" feature where existing users can provision new members using an isolated client-side auth protocol.

## 4. Next.js 15
**Role: Frontend Framework**
- **App Router**: Uses modern routing for high-performance navigation between trading terminals.
- **Optimized UI**: Leverages React server and client components with ShadCN UI for an institutional-grade experience.

## 5. Genkit
**Role: AI Orchestration**
- **Institutional Auditing**: Integrated using the Genkit SDK to perform auditing and support tasks.
