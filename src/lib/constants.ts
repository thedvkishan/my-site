
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const NETWORKS = ['BEP20', 'TRC20', 'ERC20'];

export const PAYMENT_METHODS_BUY = ['Bank Transfer', 'UPI', 'IMPS', 'NEFT', 'RTGS', 'Cash Deposit'];
export const PAYMENT_METHODS_SELL = ['Bank Transfer', 'UPI', 'IMPS', 'RTGS', 'NEFT', 'Cash Deposit'];

export const CASH_DEPOSIT_BANKS = [
  'State Bank of India',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Federal Bank',
  'Ujjivan Small Finance Bank',
];

export const COUNTRIES = ['India'];

export const MOCK_APP_LOGO_URL = PlaceHolderImages.find(img => img.id === 'app-logo-placeholder')?.imageUrl || '';

export const MOCK_BANK_DETAILS = {
  holderName: 'TetherSwap Zone LLC',
  bankName: 'Global Trust Bank',
  accountNumber: '123456789012',
  ifsc: 'GTB0000001',
};

export const MOCK_UPI_ID = 'tether.swap@gpay';
export const MOCK_QR_CODE_URL = PlaceHolderImages.find(img => img.id === 'qr-code-placeholder')?.imageUrl || '';
export const MOCK_BUY_BANNER_URL = PlaceHolderImages.find(img => img.id === 'buy-banner-placeholder')?.imageUrl || '';
export const MOCK_SELL_BANNER_URL = PlaceHolderImages.find(img => img.id === 'sell-banner-placeholder')?.imageUrl || '';

export const MOCK_DEPOSIT_DETAILS = {
  BEP20: {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    qrCodeUrl: PlaceHolderImages.find(img => img.id === 'bep20-qr-placeholder')?.imageUrl || '',
  },
  TRC20: {
    address: 'TABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    qrCodeUrl: PlaceHolderImages.find(img => img.id === 'trc20-qr-placeholder')?.imageUrl || '',
  },
  ERC20: {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    qrCodeUrl: PlaceHolderImages.find(img => img.id === 'erc20-qr-placeholder')?.imageUrl || '',
  },
};

export const MOCK_SETTINGS = {
  appLogoUrl: MOCK_APP_LOGO_URL,
  allowPublicSignup: false,
  buyRates: {
    'Bank Transfer': 95.80,
    'UPI': 95.15,
    'IMPS': 95.50,
    'NEFT': 95.30,
    'RTGS': 95.40,
    'Cash Deposit': 96.50
  },
  sellRates: {
    'Bank Transfer': 97.80,
    'UPI': 97.25,
    'IMPS': 97.50,
    'NEFT': 97.35,
    'RTGS': 97.45,
    'Cash Deposit': 98.80
  },
  minBuyAmount: 100,
  minSellAmount: 100,
  minDepositAmount: 100,
  bankDetails: MOCK_BANK_DETAILS,
  upiId: MOCK_UPI_ID,
  qrCodeUrl: MOCK_QR_CODE_URL,
  buyBannerUrl: MOCK_BUY_BANNER_URL,
  sellBannerUrl: MOCK_SELL_BANNER_URL,
  depositDetails: MOCK_DEPOSIT_DETAILS,
};


export const ADMIN_CREDENTIALS = {
  userId: 'USDTUBON21',
  password: 'ZDT6ukm@1234',
};

export const TRANSACTION_LIFETIME = 3 * 60 * 60 * 1000; // 3 hours
export const VERIFICATION_LIFETIME = 3 * 60 * 60 * 1000; // 3 hours
