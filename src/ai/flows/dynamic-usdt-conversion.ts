'use server';
/**
 * @fileOverview A dynamic USDT conversion flow that calculates buying and selling rates based on a mock market rate.
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

const prompt = ai.definePrompt({
  name: 'dynamicUSDTConversionPrompt',
  input: {schema: DynamicUSDTConversionInputSchema},
  output: {schema: DynamicUSDTConversionOutputSchema},
  prompt: `You are a financial assistant that provides USDT conversion rates.

  The current market rate for USDT is 83 INR.  For buying transactions, add a 5% markup to the market rate. For selling transactions, add a 12% markup to the market rate.

  Given the following information, calculate the equivalent INR amount and the USDT rate used for the conversion.

  USDT Amount: {{{usdtAmount}}}
  Conversion Type: {{{conversionType}}}

  Ensure that the "usdtRate" field reflects the actual rate used in the calculation, inclusive of the markup.
`,
});

const dynamicUSDTConversionFlow = ai.defineFlow(
  {
    name: 'dynamicUSDTConversionFlow',
    inputSchema: DynamicUSDTConversionInputSchema,
    outputSchema: DynamicUSDTConversionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
