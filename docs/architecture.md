# TetherSwap Zone: Centralized Institutional Architecture

This document outlines the core technologies and their roles within the TetherSwap Zone platform.

## 1. Firebase Firestore: Central Institutional Ledger
**Role: Single Source of Truth**
- **Data Persistence**: Stores all institutional data including User Profiles, Buy Protocols, Liquidation Orders, and Wallet Credit/Debit history.
- **Real-time Synchronization**: Powers the instant activity terminal and balance updates via the Firebase Client SDK.
- **Audit Archiving**: Maintains a permanent record of all administrative remarks and protocol adjustments.

## 2. Firebase Authentication: Identity Protocol
**Role: Secure Access Management**
- **Institution Access**: Manages secure login for clients and internal administrators.
- **Sub-Account Provisioning**: Enables the peer-to-peer account creation feature using isolated client-side authentication logic.

## 3. Firebase App Hosting: Managed Runtime
**Role: Scalable Institutional Environment**
- **Next.js 15 Engine**: Provides the server-side infrastructure for the trading terminals.
- **Dynamic Routing**: Handles institutional workflows and secure data fetching.
- **Global Scaling**: Automatically manages Google Cloud resources to ensure 24/7 uptime for exchange operations.

## 4. Genkit: AI Auditing Orchestration
**Role: Automated Support & Oversight**
- **Intelligent Auditing**: Integrated using Gemini Pro models to assist in transaction verification and institutional support tasks.
