/**
 * Primary barrel file for Firebase services and hooks.
 * This file centralizes exports for components to consume.
 * Internal modules use relative imports to avoid cycles.
 */

export * from './init';
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './config';
