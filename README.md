# Sub-Space - Property Sublease Platform

HomeHarmony is a modern web application that facilitates property subleasing, connecting property sellers with potential buyers. Built with React, TypeScript, and Supabase, it offers a comprehensive suite of features for managing and discovering property listings.

## Features

### For Property Sellers
- 📝 List properties with detailed information and media
- 🏢 Manage housing complexes and individual properties
- 💳 Secure payment processing via Stripe Connect
- 📊 Track property views and engagement
- ✅ Document verification system for lease agreements
- 💬 Real-time messaging with potential buyers
- ⭐ Receive and respond to reviews

## For Property Buyers
- 🔍 Advanced property search with filters
- 🗺️ Map-based property exploration
- 💖 Save favorite properties
- 💬 Chat with sellers
- ⭐ Leave reviews for sellers
- 💳 Secure payment processing
- 📱 Mobile-responsive interface

## Technology Stack

- **Frontend:**
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - Framer Motion for animations
  - React Router for navigation

- **Backend:**
  - Supabase for database and authentication
  - Express.js server
  - Stripe for payment processing
  - Google Cloud Vision API for document verification
  - Google Maps API for location services

- **APIs and Services:**
  - Stripe Connect for seller payments
  - Google Cloud Vision API for OCR
  - Google Maps for location services
  - Walkscore API for neighborhood information

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Stripe account
- Google Cloud Platform account
- Environment variables set up

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd homeharmony-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials
```

4. Start the development server:
```bash
npm run dev
```

5. In a separate terminal, start the Express backend:
```bash
npm run server
```

### Setting Up Stripe Connect

1. Create a Stripe account
2. Enable Connect in your Stripe Dashboard
3. Add your Stripe keys to the environment variables
4. Set up webhook endpoints for handling Connect account events

## Project Structure

```
├── src/
│   ├── components/    # React components
│   ├── pages/        # Route components
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utility functions
│   ├── types/        # TypeScript types
│   └── integrations/ # Third-party service integrations
├── server/
│   ├── api/          # Express API routes
│   └── utils/        # Server utilities
└── public/           # Static assets
```

## Key Features Implementation

### Property Verification
The platform uses Google Cloud Vision API for OCR (Optical Character Recognition) to verify lease documents. This ensures the authenticity of sublease listings by comparing extracted information with provided details.

### Real-time Messaging
Built using Supabase's real-time subscriptions, the chat system enables instant communication between buyers and sellers.

### Map Integration
Properties can be browsed using an interactive map interface, with custom markers showing property details and filtering options.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- shadcn/ui for the component library
- Tailwind CSS for styling
- Supabase for backend services
- Stripe for payment processing
- Google Cloud Platform for various APIs
