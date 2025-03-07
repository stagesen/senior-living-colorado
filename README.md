# Senior Living Colorado

A comprehensive digital platform designed to simplify senior living facility discovery in Colorado's Front Range region, leveraging advanced data extraction and intelligent search technologies.

## Features

- 🏘️ **Facility Discovery**: Browse and search senior living facilities across Colorado's Front Range
- 🔍 **Intelligent Search**: Advanced filtering and search capabilities for facilities and resources
- 📊 **Service Analysis**: Automated extraction of facility services and amenities using FireCrawl
- 💬 **Decision Support**: AI-powered chat service for personalized guidance
- 📱 **Responsive Design**: Mobile-friendly interface with intelligent user interactions
- 🗺️ **Location Mapping**: Comprehensive facility mapping with enhanced service details

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **APIs**: FireCrawl for service extraction, Apify for data collection
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL database
- FireCrawl API key
- Apify API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/dbname
PGHOST=your_host
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database
PGPORT=your_port

# API Keys
FIRECRAWL_API_KEY=your_firecrawl_api_key
APIFY_API_KEY=your_apify_api_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Development

- Frontend code is in the `client/src` directory
- Backend code is in the `server` directory
- Shared types and schemas are in `shared` directory

### Key Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run update-services` - Run service extraction for facilities

## Deployment

The application is designed to be deployed on Replit. Follow these steps:

1. Fork the repository on Replit
2. Set up the required environment variables
3. Run the application using the "Run" button

## Project Structure

```
├── client/            # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── server/            # Backend Express application
│   ├── services/      # Business logic
│   ├── scripts/       # Utility scripts
│   └── cron/          # Scheduled tasks
├── shared/            # Shared types and schemas
└── types/             # Additional type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
