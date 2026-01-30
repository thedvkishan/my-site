import { z } from 'zod';
import { NETWORKS, PAYMENT_METHODS_BUY, PAYMENT_METHODS_SELL, COUNTRIES } from './constants';

export const buyFormSchema = z.object({
  network: z.enum(NETWORKS as [string, ...string[]], { required_error: 'Please select a network.' }),
  usdtAmount: z.coerce.number().min(200, 'Minimum buy amount is 200 USDT.'),
  inrAmount: z.coerce.number().min(1, 'Amount must be at least 1.'),
  usdtAddress: z.string().min(10, 'Please enter a valid USDT address.'),
  paymentMode: z.enum(PAYMENT_METHODS_BUY as [string, ...string[]], { required_error: 'Please select a payment mode.' }),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().optional(),
  country: z.enum(COUNTRIES as [string, ...string[]], { required_error: 'Please select your country.' }),
});

export type BuyFormValues = z.infer<typeof buyFormSchema>;

export const sellFormSchema = z.object({
    network: z.enum(NETWORKS as [string, ...string[]], { required_error: 'Please select a network.' }),
    usdtAmount: z.coerce.number().min(100, 'Minimum sell amount is 100 USDT.'),
    inrAmount: z.coerce.number().min(1, 'Amount must be at least 1.'),
    paymentMode: z.enum(PAYMENT_METHODS_SELL as [string, ...string[]], { required_error: 'Please select a payment mode.' }),
    email: z.string().email('Please enter a valid email address.'),
    phone: z.string().optional(),
    country: z.enum(COUNTRIES as [string, ...string[]], { required_error: 'Please select your country.' }),
  }).and(z.discriminatedUnion('paymentMode', [
    z.object({
        paymentMode: z.literal('UPI'),
        upiHolderName: z.string().min(2, 'Please enter holder name.'),
        upiId: z.string().min(3, 'Please enter a valid UPI ID.'),
    }),
    z.object({
        paymentMode: z.literal('IMPS'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
    z.object({
        paymentMode: z.literal('RTGS'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
    z.object({
        paymentMode: z.literal('NEFT'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
  ]));
  

export type SellFormValues = z.infer<typeof sellFormSchema>;


export const contactFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email."),
    description: z.string().min(10, "Description must be at least 10 characters.")
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const adminLoginFormSchema = z.object({
    userId: z.string().min(1, "User ID is required."),
    password: z.string().min(1, "Password is required."),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;


const depositNetworkSchema = z.object({
  address: z.string().min(1, 'Address is required.'),
  qrCodeUrl: z.string().min(1, 'QR Code URL is required.'),
});

export const settingsSchema = z.object({
  appLogoUrl: z.string().min(1, 'Logo URL is required.'),
  bankDetails: z.object({
    holderName: z.string().min(1, 'Holder name is required.'),
    bankName: z.string().min(1, 'Bank name is required.'),
    accountNumber: z.string().min(1, 'Account number is required.'),
    ifsc: z.string().min(1, 'IFSC code is required.'),
  }),
  upiId: z.string().min(1, 'UPI ID is required.'),
  qrCodeUrl: z.string().min(1, 'QR Code URL is required.'),
  buyBannerUrl: z.string().min(1, 'Buy banner URL is required.'),
  sellBannerUrl: z.string().min(1, 'Sell banner URL is required.'),
  depositDetails: z.object({
    BEP20: depositNetworkSchema,
    TRC20: depositNetworkSchema,
    ERC20: depositNetworkSchema,
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
