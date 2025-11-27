# Hotel Analytics Cockpit (GA4)

A React + Express.js + MongoDB project that allows hotel managers to link their Google Analytics 4 (GA4) properties and view dashboards similar to DM-Cockpit's GA integration.

## Project Structure

```
.
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Middleware functions
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
└── client/                  # React frontend
    ├── src/
    │   ├── components/      # React components
    │   ├── context/         # React context providers
    │   ├── pages/           # Page components
    │   ├── services/        # API service clients
    │   ├── App.tsx          # Main App component
    │   └── main.tsx         # React entry point
    ├── package.json
    └── vite.config.ts
```

## Features Implemented

### Backend (Express.js + MongoDB)
1. **Authentication & Roles**
   - Email/password login
   - JWT-based authentication
   - Role-based access control (admin, hotel_manager)

2. **Project Management**
   - CRUD operations for Projects
   - Projects linked to hotel managers

3. **Google OAuth2 Integration**
   - OAuth flow for GA4 access
   - Secure storage of refresh tokens
   - Access token management

4. **GA4 Analytics Dashboard**
   - Overview metrics (users, sessions, engagement, etc.)
   - Session channels breakdown
   - Conversions by channel
   - Geo data (users by country)
   - Device and browser information
   - Top landing pages
   - Session sources

### Frontend (React + TypeScript)
1. **Authentication Pages**
   - Login and registration forms
   - Protected routes

2. **Dashboard**
   - Welcome screen with user information

3. **Project Management**
   - List all projects
   - Create, edit, and delete projects
   - Link GA4 properties to projects

4. **Analytics Dashboard**
   - Date range selection (7 days, 30 days, custom)
   - Overview metrics cards
   - Interactive charts (bar, pie, line)
   - Data tables for detailed information

## Technologies Used

### Backend
- Node.js with TypeScript
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Google OAuth2 API
- GA4 Data API

### Frontend
- React with TypeScript
- Vite (build tool)
- React Router for navigation
- Axios for HTTP requests
- Recharts for data visualization
- Tailwind CSS for styling

## Setup Instructions

### Prerequisites
- Node.js (LTS version)
- MongoDB (local installation)
- Google OAuth2 credentials

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Google OAuth2 credentials

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Keys Required

To run this application, you'll need to obtain the following API keys:

1. **Google OAuth2 Credentials**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Analytics API
   - Create OAuth2 credentials (Client ID and Client Secret)
   - Add `http://localhost:3000/api/google/callback` to authorized redirect URIs

2. **MongoDB Connection**
   - Install MongoDB locally or use a cloud service like MongoDB Atlas
   - Update the `MONGODB_URI` in your `.env` file

## Development

### Backend
- Built with Express.js and TypeScript
- Follows MVC pattern with services layer
- RESTful API design
- MongoDB for data persistence

### Frontend
- Built with React and TypeScript
- Component-based architecture
- Context API for state management
- Responsive design with Tailwind CSS

## Future Enhancements

1. Add unit and integration tests
2. Implement data caching for better performance
3. Add more advanced analytics features
4. Implement real-time data updates
5. Add export functionality for reports
6. Implement user preferences and settings

## License

This project is licensed under the MIT License.