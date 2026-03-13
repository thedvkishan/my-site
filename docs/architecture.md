# TetherSwap Zone: Architectural Overview

This document outlines the roles of the various technologies integrated into the platform.

## 1. Firebase App Hosting
**Role: Managed Runtime Environment**
- **Next.js Support**: Provides the server context required for Next.js 15 App Router, including Server Components and Server Actions.
- **SSR (Server-Side Rendering)**: Enables the server to pre-render pages, improving SEO and initial performance.
- **Deployment Pipeline**: Automates the build and release process from source control.
- **Security**: Handles SSL certificates and provides a secure environment for server-side logic (e.g., Genkit AI calls).

## 2. Firebase Firestore
**Role: Real-time Institutional Ledger**
- **Data Persistence**: Stores user profiles, buy/sell orders, and the permanent administrative audit trail.
- **Real-time Sync**: Powers the "Activity Terminal" (notifications), allowing users to see balance updates and order status changes instantly without refreshing.
- **Security Rules**: Enforces fine-grained access control, ensuring institutional users can only access their own data while admins maintain oversight.

## 3. Firebase Authentication
**Role: Identity & Access Management**
- **Secure Access**: Manages login protocols for both institutional clients and administrators.
- **Peer Provisioning**: Enables the "Sub-Account" feature where existing users can provision new members using an isolated auth protocol.

## 4. Next.js 15 (App Router)
**Role: Full-stack Application Framework**
- **Client/Server Boundary**: Separates high-performance UI (React) from secure business logic (Server Actions).
- **Optimization**: Handles image optimization, font loading, and routing.

## 5. Genkit
**Role: AI Orchestration**
- **Institutional Auditing**: (Planned) Used to automate the auditing of transaction patterns and support inquiries.
- **Support Flows**: Powers intelligent support assistance for clearing requests.