'use server';
/**
 * @fileOverview A dynamic USDT conversion flow that calculates buying and selling rates based on fixed rates.
 *
 * - getDynamicUSDTConversion - A function that returns buying and selling rates for USDT.
 * - DynamicUSDTConversionInput - The input type for the getDynamicUSDTConversion function.
 * - DynamicUSDTConversionOutput - The return type for the getDynamicUSDTConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicUSDTConversionInputSchema = z.object({
  usdtAmount: z.number().describe('The amount of USDT to convert.'),
  conversionType: z.enum(['buy', 'sell']).describe('The type of conversion: buy or sell.'),
});
export type DynamicUSDTConversionInput = z.infer<typeof DynamicUSDTConversionInputSchema>;

const DynamicUSDTConversionOutputSchema = z.object({
  inrAmount: z.number().describe('The equivalent amount in INR.'),
  usdtRate: z.number().describe('The USDT rate used for the conversion.'),
});
export type DynamicUSDTConversionOutput = z.infer<typeof DynamicUSDTConversionOutputSchema>;

export async function getDynamicUSDTConversion(
  input: DynamicUSDTConversionInput
): Promise<DynamicUSDTConversionOutput> {
  return dynamicUSDTConversionFlow(input);
}

const dynamicUSDTConversionFlow = ai.defineFlow(
  {
    name: 'dynamicUSDTConversionFlow',
    inputSchema: DynamicUSDTConversionInputSchema,
    outputSchema: DynamicUSDTConversionOutputSchema,
  },
  async input => {
    const { usdtAmount, conversionType } = input;
    let usdtRate: number;

    if (conversionType === 'buy') {
      usdtRate = 95.15;
    } else { // 'sell'
      usdtRate = 97.25;
    }

    const inrAmount = usdtAmount * usdtRate;

    return {
      inrAmount: parseFloat(inrAmount.toFixed(2)),
      usdtRate,
    };
  }
);
