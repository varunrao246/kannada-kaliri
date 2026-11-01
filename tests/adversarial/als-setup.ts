import { AsyncLocalStorage } from 'node:async_hooks';

// Polyfill AsyncLocalStorage on globalThis before any Next.js module is imported
globalThis.AsyncLocalStorage = AsyncLocalStorage;
global.AsyncLocalStorage = AsyncLocalStorage;

