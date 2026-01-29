import { PlaceHolderImages } from '@/lib/placeholder-images';

export const NETWORKS = ['BEP20', 'TRC20', 'ERC20'];

export const PAYMENT_METHODS_BUY = ['Cash Deposit', 'UPI', 'IMPS', 'NEFT', 'RTGS'];
export const PAYMENT_METHODS_SELL = ['UPI', 'IMPS', 'RTGS', 'NEFT'];

export const COUNTRIES = ['India'];

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

export const MOCK_USDT_ADDRESSES = {
  BEP20: '0x1234567890abcdef1234567890abcdef12345678',
  TRC20: 'TABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  ERC20: '0xabcdef1234567890abcdef1234567890abcdef12',
};

export const ADMIN_CREDENTIALS = {
  userId: 'USDTUBON21',
  password: 'ZDT6ukm@1234',
};

export const TRANSACTION_LIFETIME = 3 * 60 * 60 * 1000; // 3 hours
export const VERIFICATION_LIFETIME = 3 * 60 * 60 * 1000; // 3 hours
