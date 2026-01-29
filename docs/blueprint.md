# **App Name**: TetherSwap Zone

## Core Features:

- Buy USDT Form: Form to buy USDT with fields for network selection (BEP20, TRC20, ERC20), USDT amount, INR amount (with auto-conversion), USDT address, payment mode (Cash Deposit, UPI, IMPS, NEFT, RTGS), contact email, and phone number. Includes payment instructions display and unique token generation after submission. Implements mock data storage.
- Sell USDT Form: Form to sell USDT with similar fields as the buy form: network selection (BEP20, TRC20, ERC20), USDT amount, INR amount (auto-conversion), payment receiving mode (Cash Deposit, UPI, IMPS, RTGS, NEFT) with additional fields for UPI holder name/ID or bank details, contact email, and phone number. Also show the USDT deposit address depending on user's choice of BEP20/TRC20/ERC20 network. Includes address display. Implements mock data storage.
- USDT Rate Calculation: Automatically calculates USDT buying rate at 5% above market rate and selling rate at 12% above market rate. This simulates interacting with an external market data 'tool' via generative AI, even though mock data is used instead.
- Payment Method Upload: Admin dashboard page to upload QR codes and payment methods, with restricted access via user ID (USDTUBON21) and password (ZDT6ukm@1234). Mock data storage implemented. Provides form interface.
- Deposit Verification: Simulates the verification process for both deposit and withdrawals, a new page open asking to confirm the deposit. Implements a timer (3 hours) with a 'No deposit found' message and automatic cancellation after timeout.
- Contact Form: A contact form page accessible via a link in the site's footer. Form fields: user's name, user's email address, problem description. Send button triggers submission. This should work on its own page.

## Style Guidelines:

- Primary color: Green (#32CD32) to represent transactions and financial activities.
- Background color: Light gray (#F5F5F5) to create a clean and neutral backdrop.
- Accent color: Blue (#2196F3) to highlight interactive elements and calls to action.
- Body and headline font: 'Inter', a grotesque sans-serif, should be used across the website. Its neutral appearance complements financial information without causing distraction.
- Use Tether (USDT) icon prominently, alongside other related financial icons for payment methods and security.
- Ensure a clear and intuitive layout with well-defined sections for buying and selling USDT. Prioritize ease of use and quick access to key information.
- Use subtle animations (e.g., loading spinners, progress bars) to provide feedback during transactions and payment processing.