'use server';

import { getDynamicUSDTConversion } from "@/ai/flows/dynamic-usdt-conversion";

export async function getConversionRates() {
  try {
    const buyRateResponse = await getDynamicUSDTConversion({ usdtAmount: 1, conversionType: 'buy' });
    const sellRateResponse = await getDynamicUSDTConversion({ usdtAmount: 1, conversionType: 'sell' });

    if (!buyRateResponse || !sellRateResponse) {
      throw new Error('Failed to fetch conversion rates');
    }

    return {
      success: true,
      data: {
        buyRate: buyRateResponse.usdtRate,
        sellRate: sellRateResponse.usdtRate,
      },
    };
  } catch (error) {
    console.error('Error fetching conversion rates:', error);
    return {
      success: false,
      error: 'Could not fetch conversion rates. Please try again later.',
    };
  }
}
