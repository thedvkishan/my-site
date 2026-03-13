'use client';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for TetherSwap Zone.
 * Used for institutional auditing and support flows.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
