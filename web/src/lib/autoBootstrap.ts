import { ensureDbIndexes } from './dbInit';

let bootstrapComplete = false;

/**
 * Automatically runs DB bootstrap on first API request in each server instance.
 * Safe to call multiple times; only executes once per process lifetime.
 */
export async function autoBootstrap() {
  if (bootstrapComplete) return;
  
  try {
    await ensureDbIndexes();
    bootstrapComplete = true;
    console.log('Database bootstrap complete');
  } catch (error) {
    console.error('Database bootstrap failed:', error);
    // Don't block requests on bootstrap failure
  }
}
