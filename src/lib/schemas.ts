
import { z } from 'zod';
import { NETWORKS, PAYMENT_METHODS_BUY, PAYMENT_METHODS_SELL, COUNTRIES } from './constants';

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

export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    captcha: z.boolean().refine(val => val === true, "Please verify you are not a robot.")
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
    captcha: z.boolean().refine(val => val === true, "Please verify you are not a robot.")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type SignupFormValues = z.infer<typeof signupSchema>;


const depositNetworkSchema = z.object({
  address: z.string().min(1, 'Address is required.'),
  qrCodeUrl: z.string().min(1, 'QR Code URL is required.'),
});

export const settingsSchema = z.object({
  appLogoUrl: z.string().min(1, 'Logo URL is required.'),
  buyRate: z.coerce.number().positive('Rate must be a positive number.'),
  sellRate: z.coerce.number().positive('Rate must be a positive number.'),
  minBuyAmount: z.coerce.number().positive('Minimum buy amount must be a positive number.'),
  minSellAmount: z.coerce.number().positive('Minimum sell amount must be a positive number.'),
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
