# Hotel Analytics Cockpit - Setup Instructions

## Project Overview

This is a full-stack web application that allows hotel managers to:
1. Register and log in to the system
2. Create projects for their hotel websites
3. Link Google Analytics 4 (GA4) properties to their projects
4. View analytics dashboards with key metrics and visualizations

## Technology Stack

### Backend
- Node.js with TypeScript
- Express.js framework
- MongoDB database with Mongoose ODM
- JWT for authentication
- Google OAuth2 API for GA4 integration

### Frontend
- React with TypeScript
- Vite build tool
- React Router for navigation
- Recharts for data visualization
- Tailwind CSS for styling

## Prerequisites

Before running this application, you'll need:

1. **Node.js** (LTS version recommended)
2. **MongoDB** (local installation or cloud service like MongoDB Atlas)
3. **Google OAuth2 Credentials** (see below for instructions)

## Setup Instructions

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secret key for JWT token signing
- `GOOGLE_CLIENT_ID`: Your Google OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth2 Client Secret

Build the backend:
```bash
npm run build
```

Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`.

### 2. Frontend Setup

Navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

### 3. Google OAuth2 Setup

To enable Google Analytics integration, you'll need to set up Google OAuth2 credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Analytics API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Analytics API" and enable it
4. Create OAuth2 credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add `http://localhost:3000/api/google/callback` to "Authorized redirect URIs"
   - Save and note your Client ID and Client Secret
5. Update your backend `.env` file with the Google credentials

### 4. MongoDB Setup

You can either:

1. **Install MongoDB locally:**
   - Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start the MongoDB service
   - Update the `MONGODB_URI` in your `.env` file to `mongodb://localhost:27017/hotel-analytics`

2. **Use MongoDB Atlas (cloud):**
   - Sign up for a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Configure database access and network access
   - Get your connection string and update the `MONGODB_URI` in your `.env` file

## Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd client
   npm run dev
   ```

### Production Mode

1. Build both applications:
   ```bash
   cd backend
   npm run build
   
   cd ../client
   npm run build
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

3. Serve the frontend build (you can use any static file server):
   ```bash
   cd client
   # Using Vite's preview command:
   npm run preview
   ```

## API Endpoints

The backend provides the following RESTful API endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user information

### Projects
- `POST /api/projects` - Create a new project
- `GET /api/projects` - Get all projects for the current user
- `GET /api/projects/:id` - Get a specific project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Google Integration
- `GET /api/google/auth` - Initiate Google OAuth flow
- `POST /api/google/callback` - Handle OAuth callback
- `POST /api/google/property` - Link GA4 property to project

### Analytics
- `GET /api/analytics/overview/:projectId` - Get overview metrics
- `GET /api/analytics/channels/:projectId` - Get session channels data
- `GET /api/analytics/conversions/:projectId` - Get conversions by channel
- `GET /api/analytics/geo/:projectId` - Get geo data
- `GET /api/analytics/devices/:projectId` - Get device data
- `GET /api/analytics/landing-pages/:projectId` - Get top landing pages
- `GET /api/analytics/sources/:projectId` - Get session sources

## Frontend Pages

The React frontend includes the following pages:

1. **Login** (`/login`) - User authentication
2. **Register** (`/register`) - New user registration
3. **Dashboard** (`/dashboard`) - Main dashboard after login
4. **Projects** (`/projects`) - List and manage projects
5. **Project Detail** (`/projects/:id`) - View and edit project details
6. **Analytics** (`/analytics/:projectId`) - View analytics dashboard for a project

## Development Notes

### Backend Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Middleware functions
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── .env                 # Environment variables (not committed)
├── .env.example         # Example environment variables
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

### Frontend Structure
```
client/
├── src/
│   ├── components/      # React components
│   ├── context/         # React context providers
│   ├── pages/           # Page components
│   ├── services/        # API service clients
│   ├── App.tsx          # Main App component
│   └── main.tsx         # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.ts       # Vite configuration
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 5173 are already in use, you can change them in the respective configuration files.

2. **MongoDB connection errors**: Ensure MongoDB is running and the connection string in `.env` is correct.

3. **Google OAuth errors**: Verify that your Google credentials are correct and the redirect URI is properly configured.

4. **TypeScript compilation errors**: Make sure all dependencies are installed and the TypeScript compiler can find all type definitions.

### Getting Help

If you encounter any issues not covered in this document, please check:
1. The console output for error messages
2. The README.md file for additional information
3. The source code comments for implementation details

## Contributing

This project is set up as a complete working example. Feel free to extend it with additional features or improvements.