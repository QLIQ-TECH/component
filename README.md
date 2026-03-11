## QLIQ Marketplace - Next.js Implementation

This is a Next.js implementation of the QLIQ marketplace design based on the provided Figma design.

## Features

- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile
- **Modern Components**: Modular React components with TypeScript
- **Navigation**: Interactive navigation bar with category links
- **Product Showcase**: Multiple product sections with cards, ratings, and interactive elements
- **Image Sliders**: Interactive image carousels with navigation controls
- **Categories**: Organized category sections with hover effects
- **Banners**: Promotional banner sections with call-to-action buttons
- **Influencer Cards**: Social media influencer showcase cards
- **FAQ Section**: Collapsible FAQ accordion
- **Footer**: Comprehensive footer with newsletter signup and social links

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Styled JSX**: Component-scoped CSS
- **Next/Image**: Optimized image loading
- **Responsive Design**: CSS Grid and Flexbox layouts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository or extract the files
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── Navigation.tsx       # Main navigation bar
│   ├── Categories.tsx       # Category selection section
│   ├── ImageSlider.tsx      # Image carousel component
│   ├── ProductCard.tsx      # Product display card
│   ├── SectionHeader.tsx    # Reusable section headers
│   ├── Banner.tsx           # Promotional banner component
│   ├── CategoryCard.tsx     # Category display card
│   ├── InfluencerCard.tsx   # Influencer showcase card
│   ├── FAQ.tsx              # FAQ accordion section
│   └── Footer.tsx           # Site footer
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Component Features

### Navigation
- Active state management
- Mobile-responsive design
- Search, wishlist, cart, and profile actions

### Product Cards
- Interactive wishlist and cart buttons
- Rating display with stars
- Delivery time badges
- Hover effects and animations

### Image Slider
- Navigation arrows
- Smooth transitions
- Touch/swipe support ready

### FAQ Section
- Collapsible accordion interface
- Smooth expand/collapse animations
- Accessible keyboard navigation

### Banners
- Background image support
- Call-to-action buttons
- Responsive text layouts

## Customization

### Colors
The design uses a consistent color palette:
- Primary Blue: `#0082FF`
- Black: `#000`
- White: `#FFF`
- Light backgrounds: `rgba(0, 130, 255, 0.24)`

### Typography
- Primary font: DM Sans
- Secondary fonts: Inter, Helvetica Neue
- Font weights: 400, 500, 600, 700

### Responsive Breakpoints
- Desktop: 1440px+
- Tablet: 768px - 1439px
- Mobile: < 768px

## Performance Optimizations

- Next.js Image optimization
- Component code splitting
- CSS-in-JS for better performance
- Optimized font loading

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style and component patterns
2. Ensure responsive design across all screen sizes
3. Test accessibility features
4. Optimize images and assets

## License

This project is for demonstration purposes based on the provided Figma design.
