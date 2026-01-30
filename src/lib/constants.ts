import { PlaceHolderImages } from '@/lib/placeholder-images';

export const NETWORKS = ['BEP20', 'TRC20', 'ERC20'];

export const PAYMENT_METHODS_BUY = ['Cash Deposit', 'UPI', 'IMPS', 'NEFT', 'RTGS'];
export const PAYMENT_METHODS_SELL = ['UPI', 'IMPS', 'RTGS', 'NEFT'];

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
