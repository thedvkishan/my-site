# TetherSwap Zone: Architectural Overview

This document outlines the roles of the various technologies integrated into the platform.

## 1. Firebase Hosting (Standard/Free Tier)
**Role: Static Content Delivery**
- **Static Site Generation (SSG)**: The application is built as a static Single Page Application (SPA) using `output: 'export'`.
- **Global CDN**: Content is cached at the edge for low-latency access globally.
- **Zero Server Overhead**: By eliminating Server-Side Rendering (SSR), the app runs entirely in the client's browser, maximizing efficiency and eliminating the need for paid App Hosting runtimes.

## 2. Firebase Firestore
**Role: Real-time Institutional Ledger**
- **Data Persistence**: Stores user profiles, buy/sell orders, and the permanent administrative audit trail.
- **Real-time Sync**: Powers the "Activity Terminal" (notifications), allowing users to see balance updates and order status changes instantly without refreshing.
- **Security Rules**: Enforces fine-grained access control, ensuring institutional users can only access their own data while admins maintain oversight.

## 3. Firebase Authentication
**Role: Identity & Access Management**
- **Secure Access**: Manages login protocols for both institutional clients and administrators.
- **Peer Provisioning**: Enables the "Sub-Account" feature where existing users can provision new members using an isolated client-side auth protocol.

## 4. Next.js 15 (Client-Side)
**Role: Frontend Framework**
- **Dynamic Routing**: Uses client-side routing to navigate between trading terminals.
- **Optimized UI**: Handles high-performance rendering using React components and ShadCN UI.

## 5. Genkit
**Role: AI Orchestration (Client-Side)**
- **Institutional Auditing**: (Planned) Integrated using the Genkit Client SDK to perform auditing tasks directly in the browser environment.
