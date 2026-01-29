'use server';

import { getDynamicUSDTConversion } from "@/ai/flows/dynamic-usdt-conversion";
import { ContactFormValues } from "./schemas";

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


export async function submitContactForm(values: ContactFormValues) {
    console.log('Received contact form submission:', values);
    // In a real application, you would process this data, e.g., send an email.
    // For this mock app, we'll just simulate a successful submission.
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        success: true,
        message: "Thank you for your message! We'll get back to you shortly."
    };
}
