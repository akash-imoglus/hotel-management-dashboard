# System Architecture Documentation
## Hotel Analytics Cockpit - Multi-Platform Analytics Dashboard

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Detailed Web Application Workflow](#detailed-web-application-workflow)
4. [API Integrations](#api-integrations)
5. [Data Extraction Mechanisms](#data-extraction-mechanisms)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Security & Authentication](#security--authentication)
8. [Database Schema](#database-schema)
9. [Caching Strategy](#caching-strategy)
10. [Error Handling & Resilience](#error-handling--resilience)

---

## System Overview

The **Hotel Analytics Cockpit** is a full-stack web application that aggregates analytics data from multiple marketing and analytics platforms into a unified dashboard. The system enables hotel managers to connect their various marketing accounts (Google Analytics, Google Ads, Facebook, Instagram, Meta Ads, Google Search Console) and view comprehensive analytics in one place.

### Technology Stack

**Backend:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with httpOnly cookies
- **Password Hashing**: bcryptjs

**Frontend:**
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **State Management**: React Context API

**External APIs:**
- Google Analytics 4 (GA4) Data API
- Google Ads API
- Google Search Console API
- Facebook Graph API
- Instagram Graph API
- Meta Ads API

---

## Architecture Components

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React App   │  │   Pages      │  │  Components   │       │
│  │   (Vite)      │  │   & Routes   │  │  & Charts     │       │
│  └──────┬────────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                   │                  │                │
│         └───────────────────┼──────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  API Services   │                          │
│                    │   (Axios)       │                          │
└────────────────────┼──────────────────┼─────────────────────────┘
                     │                  │
                     │  HTTP/REST       │
┌────────────────────┼──────────────────┼─────────────────────────┐
│                    │                  │                           │
│         ┌──────────▼──────────┐      │                           │
│         │   EXPRESS SERVER     │      │                           │
│         │   (Port 3000)       │      │                           │
│         └──────────┬──────────┘      │                           │
│                    │                  │                           │
│    ┌──────────────┼──────────────┐  │                           │
│    │                              │  │                           │
│ ┌──▼──────────┐         ┌────────▼──┐                          │
│ │  Routes     │         │ Middleware │                          │
│ │  Layer      │         │  (Auth,   │                          │
│ │             │         │   Error)  │                          │
│ └──┬──────────┘         └──────────┘                          │
│    │                                                             │
│ ┌──▼──────────┐                                                 │
│ │ Controllers │                                                 │
│ │  Layer      │                                                 │
│ └──┬──────────┘                                                 │
│    │                                                             │
│ ┌──▼──────────┐                                                 │
│ │  Services   │                                                 │
│ │  Layer      │                                                 │
│ └──┬──────────┘                                                 │
│    │                                                             │
│ ┌──▼──────────┐         ┌──────────────┐                        │
│ │   Models     │         │   External   │                        │
│ │  (Mongoose)  │         │     APIs     │                        │
│ └──┬───────────┘         └──────┬───────┘                        │
│    │                             │                                 │
│ ┌──▼─────────────────────────────▼──┐                            │
│ │      MONGODB DATABASE             │                            │
│ │  ┌────────┐  ┌────────┐         │                            │
│ │  │ Users  │  │Projects│  ...   │                            │
│ │  └────────┘  └────────┘         │                            │
│ └──────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **Frontend (Client)**
- **Location**: `/client/src/`
- **Key Directories**:
  - `pages/`: Page components (Dashboard, Analytics, Projects, etc.)
  - `components/`: Reusable UI components (Charts, Tables, Forms)
  - `services/`: API client services (Axios wrappers)
  - `context/`: React Context providers (AuthContext)
  - `routes/`: Route configuration and guards

#### 2. **Backend (Server)**
- **Location**: `/backend/src/`
- **Key Directories**:
  - `routes/`: API endpoint definitions
  - `controllers/`: Request handlers (business logic entry points)
  - `services/`: Business logic and API integrations
  - `models/`: MongoDB schemas (Mongoose models)
  - `middleware/`: Express middleware (auth, error handling)
  - `config/`: Configuration files (OAuth clients, database, environment)

---

## Detailed Web Application Workflow

### 1. User Authentication Flow

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  User   │────────▶│ Frontend │────────▶│ Backend  │────────▶│ MongoDB  │
│         │         │  (React) │         │ (Express) │         │          │
└─────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                    │                    │
     │  1. Login Form     │                    │                    │
     │◀───────────────────│                    │                    │
     │                    │                    │                    │
     │  2. Submit Creds   │                    │                    │
     │───────────────────▶│                    │                    │
     │                    │  3. POST /api/auth │                    │
     │                    │      /login        │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │  4. Query User     │
     │                    │                    │     Collection     │
     │                    │                    │───────────────────▶│
     │                    │                    │                    │
     │                    │                    │  5. Verify Password│
     │                    │                    │◀───────────────────│
     │                    │                    │                    │
     │                    │                    │  6. Generate JWT   │
     │                    │                    │                    │
     │                    │  7. Set httpOnly   │                    │
     │                    │      Cookie        │                    │
     │                    │◀───────────────────│                    │
     │                    │                    │                    │
     │  8. Redirect to    │                    │                    │
     │     Dashboard      │                    │                    │
     │◀───────────────────│                    │                    │
```

**Steps:**
1. User navigates to `/login`
2. User enters email and password
3. Frontend sends POST request to `/api/auth/login` with credentials
4. Backend queries MongoDB User collection
5. Backend verifies password using bcryptjs
6. Backend generates JWT token
7. Backend sets JWT as httpOnly cookie (secure, sameSite)
8. Frontend redirects to `/dashboard`

### 2. Project Creation Flow

```
User → Frontend → Backend → MongoDB
 │        │          │          │
 │  1. Create Project Form      │
 │◀────────│                    │
 │        │                     │
 │  2. Submit Project Data      │
 │────────▶│                    │
 │        │  3. POST /api/      │
 │        │     projects        │
 │        │───────────▶│        │
 │        │            │  4. Create Project │
 │        │            │     Document        │
 │        │            │───────────▶│        │
 │        │            │            │        │
 │        │            │  5. Return Project  │
 │        │            │◀───────────│        │
 │        │  6. Display Project  │          │
 │◀────────│            │          │          │
```

**Steps:**
1. User navigates to `/projects/new`
2. User fills form (name, website URL)
3. Frontend sends POST to `/api/projects` with project data
4. Backend creates Project document in MongoDB (linked to user via `userId`)
5. Backend returns created project
6. Frontend displays project in dashboard

### 3. OAuth Connection Flow (Google Analytics Example)

```
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  User   │  │Frontend │  │ Backend  │  │  Google  │  │ MongoDB  │
│         │  │         │  │          │  │  OAuth   │  │          │
└────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │           │              │              │              │
     │ 1. Click  │              │              │              │
     │ "Connect" │              │              │              │
     │──────────▶│              │              │              │
     │           │ 2. GET /api/ │              │              │
     │           │ google/auth  │              │              │
     │           │─────────────▶│              │              │
     │           │              │ 3. Generate  │              │
     │           │              │ Auth URL     │              │
     │           │              │              │              │
     │           │ 4. Redirect  │              │              │
     │           │ to Google    │              │              │
     │           │──────────────┼─────────────▶│              │
     │           │              │              │              │
     │ 5. User   │              │              │              │
     │ Authorizes│              │              │              │
     │───────────┼──────────────┼──────────────┼──────────────│
     │           │              │              │              │
     │           │              │ 6. Callback  │              │
     │           │              │ with code   │              │
     │           │◀──────────────┼──────────────│              │
     │           │              │              │              │
     │           │              │ 7. Exchange  │              │
     │           │              │ code for    │              │
     │           │              │ tokens      │              │
     │           │              │─────────────▶│              │
     │           │              │              │              │
     │           │              │ 8. Receive  │              │
     │           │              │ access &   │              │
     │           │              │ refresh     │              │
     │           │              │ tokens      │              │
     │           │              │◀─────────────│              │
     │           │              │              │              │
     │           │              │ 9. Save     │              │
     │           │              │ Connection  │              │
     │           │              │─────────────┼─────────────▶│
     │           │              │              │              │
     │           │ 10. Redirect │              │              │
     │           │ to Dashboard │              │              │
     │◀──────────│              │              │              │
```

**Steps:**
1. User clicks "Connect Google Analytics" on project page
2. Frontend requests `/api/google/auth?projectId=xxx`
3. Backend generates OAuth2 authorization URL with state parameter
4. Frontend redirects user to Google OAuth consent screen
5. User authorizes application
6. Google redirects to `/api/google/callback?code=xxx&state=xxx`
7. Backend exchanges authorization code for access token and refresh token
8. Google returns tokens
9. Backend saves connection to MongoDB (GAConnection model)
10. Frontend redirects to dashboard with success message

### 4. Analytics Data Fetching Flow

```
User → Frontend → Backend → Cache → External API → Backend → Frontend
 │        │          │        │         │           │          │
 │  1. Request Analytics      │         │           │          │
 │────────▶│                   │         │           │          │
 │        │  2. GET /api/      │         │           │          │
 │        │ analytics/overview │         │           │          │
 │        │───────────▶│       │         │           │          │
 │        │            │  3. Check Cache │           │          │
 │        │            │───────────▶│   │           │          │
 │        │            │            │   │           │          │
 │        │            │  4. Cache Hit? │           │          │
 │        │            │◀───────────│   │           │          │
 │        │            │            │   │           │          │
 │        │            │  5. No - Get  │           │          │
 │        │            │ Access Token  │           │          │
 │        │            │───────────┼───┼───────────▶│          │
 │        │            │            │   │           │          │
 │        │            │  6. Call GA4 │           │          │
 │        │            │ Data API     │           │          │
 │        │            │───────────────┼───────────▶│          │
 │        │            │               │           │          │
 │        │            │  7. Return Data│           │          │
 │        │            │◀───────────────┼───────────│          │
 │        │            │               │           │          │
 │        │            │  8. Process &  │           │          │
 │        │            │ Transform Data │           │          │
 │        │            │               │           │          │
 │        │            │  9. Cache Data │           │          │
 │        │            │───────────▶│   │           │          │
 │        │            │            │   │           │          │
 │        │  10. Return Analytics │   │           │          │
 │        │◀───────────│            │   │           │          │
 │        │            │            │   │           │          │
 │  11. Display Charts │            │   │           │          │
 │◀────────│            │            │   │           │          │
```

**Steps:**
1. User selects date range and requests analytics
2. Frontend sends GET request to `/api/analytics/overview?projectId=xxx&startDate=xxx&endDate=xxx`
3. Backend checks MongoDB cache (AnalyticsCache model)
4. If cache hit and not expired, return cached data
5. If cache miss, get access token from GAConnection
6. Call GA4 Data API with property ID, metrics, dimensions, date range
7. GA4 API returns raw data
8. Backend processes and transforms data (converts percentages, durations, etc.)
9. Backend caches processed data in MongoDB (30-minute TTL)
10. Backend returns formatted data to frontend
11. Frontend displays data in charts and tables

---

## API Integrations

### 1. Google Analytics 4 (GA4) Integration

#### Authentication
- **OAuth2 Flow**: Standard OAuth2 authorization code flow
- **Scopes**: `https://www.googleapis.com/auth/analytics.readonly`
- **Token Storage**: Refresh tokens stored in MongoDB (GAConnection model)
- **Token Refresh**: Automatic refresh when access token expires

#### Configuration
```typescript
// backend/src/config/google.ts
- Client ID: GOOGLE_CLIENT_ID
- Client Secret: GOOGLE_CLIENT_SECRET
- Redirect URI: http://localhost:3000/api/google/callback
- Scopes: ['https://www.googleapis.com/auth/analytics.readonly']
```

#### Service Architecture
```
gaAuthService (Authentication)
├── generateAuthUrl() - Creates OAuth2 authorization URL
├── handleCallback() - Exchanges code for tokens
├── saveConnection() - Stores tokens in MongoDB
├── getConnectionByProject() - Retrieves connection
├── refreshAccessToken() - Refreshes expired tokens
└── getGA4Properties() - Lists user's GA4 properties

gaDataService (Data Extraction)
├── initializeClient() - Creates BetaAnalyticsDataClient
├── getAccessToken() - Gets valid access token (refreshes if needed)
└── runReport() - Executes GA4 Data API queries
```

#### Data Extraction Process
1. **Get Access Token**: Retrieve from GAConnection, refresh if expired
2. **Initialize Client**: Create BetaAnalyticsDataClient with OAuth2 credentials
3. **Build Request**: Construct report request with:
   - Property ID: `properties/{propertyId}`
   - Metrics: Array of metric names (e.g., `totalUsers`, `sessions`)
   - Dimensions: Array of dimension names (e.g., `country`, `deviceCategory`)
   - Date Ranges: Array of `{startDate, endDate}` objects
4. **Execute Query**: Call `runReport()` method
5. **Process Response**: Transform raw API response to frontend format

#### Example API Call
```typescript
// Request
POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
Headers:
  Authorization: Bearer {access_token}
Body:
{
  "metrics": [
    {"name": "totalUsers"},
    {"name": "sessions"}
  ],
  "dimensions": [
    {"name": "country"}
  ],
  "dateRanges": [
    {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  ]
}

// Response
{
  "rows": [
    {
      "dimensionValues": [{"value": "United States"}],
      "metricValues": [
        {"value": "1250"},
        {"value": "2100"}
      ]
    }
  ]
}
```

---

### 2. Google Ads API Integration

#### Authentication
- **OAuth2 Flow**: Standard OAuth2 authorization code flow
- **Scopes**: `https://www.googleapis.com/auth/adwords`
- **Additional Requirement**: Developer Token (from Google Ads account)
- **Token Storage**: Refresh tokens stored in MongoDB (GoogleAdsConnection model)

#### Configuration
```typescript
// backend/src/config/googleAds.ts
- Client ID: GOOGLE_ADS_CLIENT_ID
- Client Secret: GOOGLE_ADS_CLIENT_SECRET
- Redirect URI: http://localhost:3000/api/google-ads/callback
- Developer Token: GOOGLE_ADS_DEVELOPER_TOKEN (required)
- Scopes: ['https://www.googleapis.com/auth/adwords']
```

#### Service Architecture
```
googleAdsAuthService (Authentication)
├── generateAuthUrl() - Creates OAuth2 authorization URL
├── handleCallback() - Exchanges code for tokens
├── saveConnection() - Stores tokens in MongoDB
├── getConnectionByProject() - Retrieves connection
├── refreshAccessToken() - Refreshes expired tokens
└── getGoogleAdsCustomers() - Lists accessible customer accounts

googleAdsDataService (Data Extraction)
├── getAccessToken() - Gets valid access token
├── getOverviewMetrics() - Fetches account overview
├── getLocationData() - Fetches geographic performance
├── getDeviceData() - Fetches device performance
├── getCampaigns() - Fetches campaign list
└── getKeywords() - Fetches keyword performance
```

#### Data Extraction Process
1. **Get Access Token**: Retrieve from GoogleAdsConnection
2. **List Customers**: Call `/customers:listAccessibleCustomers` endpoint
3. **Query Customer Data**: Use GAQL (Google Ads Query Language) via REST API
4. **Process Response**: Transform to frontend format

#### Example API Call
```typescript
// List Accessible Customers
GET https://googleads.googleapis.com/v16/customers:listAccessibleCustomers
Headers:
  Authorization: Bearer {access_token}
  developer-token: {developer_token}

// Query Customer Data
POST https://googleads.googleapis.com/v16/customers/{customerId}/googleAds:search
Headers:
  Authorization: Bearer {access_token}
  developer-token: {developer_token}
Body:
{
  "query": "SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks FROM campaign WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'"
}
```

---

### 3. Google Search Console Integration

#### Authentication
- **OAuth2 Flow**: Standard OAuth2 authorization code flow
- **Scopes**: `https://www.googleapis.com/auth/webmasters.readonly`
- **Token Storage**: Refresh tokens stored in MongoDB (GoogleSearchConsoleConnection model)

#### Configuration
```typescript
// backend/src/config/googleSearchConsole.ts
- Client ID: GOOGLE_SEARCH_CONSOLE_CLIENT_ID
- Client Secret: GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
- Redirect URI: http://localhost:3000/api/gsc/callback
- Scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
```

#### Service Architecture
```
googleSearchConsoleAuthService (Authentication)
├── generateAuthUrl() - Creates OAuth2 authorization URL
├── handleCallback() - Exchanges code for tokens
├── saveConnection() - Stores tokens in MongoDB
├── getConnectionByProject() - Retrieves connection
├── refreshAccessToken() - Refreshes expired tokens
└── getSearchConsoleSites() - Lists verified sites

googleSearchConsoleDataService (Data Extraction)
├── getAccessToken() - Gets valid access token
├── getSearchAnalytics() - Fetches search performance data
├── getSitemaps() - Fetches sitemap information
└── getUrlInspection() - Inspects URL indexing status
```

#### Data Extraction Process
1. **Get Access Token**: Retrieve from GoogleSearchConsoleConnection
2. **Initialize Client**: Create googleapis webmasters client
3. **Query Data**: Use Search Console API v3
4. **Process Response**: Transform to frontend format

---

### 4. Facebook Graph API Integration

#### Authentication
- **OAuth2 Flow**: Facebook OAuth2 (similar to OAuth2 but with Facebook-specific endpoints)
- **Scopes**: `pages_read_engagement`, `pages_read_user_content`, `pages_show_list`
- **Token Types**: Short-lived (1-2 hours) → Long-lived (60 days)
- **Token Storage**: Long-lived tokens stored in MongoDB (FacebookConnection model)

#### Configuration
```typescript
// backend/src/config/facebook.ts
- App ID: FACEBOOK_APP_ID
- App Secret: FACEBOOK_APP_SECRET
- Redirect URI: http://localhost:3000/api/facebook/callback
- API Base URL: https://graph.facebook.com/v18.0
```

#### Service Architecture
```
facebookAuthService (Authentication)
├── generateAuthUrl() - Creates Facebook OAuth URL
├── handleCallback() - Exchanges code for short-lived token
├── exchangeForLongLivedToken() - Converts to long-lived token
├── saveConnection() - Stores tokens in MongoDB
├── getConnectionByProject() - Retrieves connection
├── refreshAccessToken() - Refreshes long-lived token
└── getFacebookPages() - Lists user's Facebook pages

facebookDataService (Data Extraction)
├── getAccessToken() - Gets valid access token
├── getPageInsights() - Fetches page performance metrics
├── getPagePosts() - Fetches page posts
└── getPageEngagement() - Fetches engagement metrics
```

#### Data Extraction Process
1. **Get Access Token**: Retrieve from FacebookConnection, refresh if expired
2. **Make Graph API Request**: Use REST endpoints (e.g., `/me/accounts`, `/{page-id}/insights`)
3. **Handle Pagination**: Use cursor-based pagination (`paging.next`)
4. **Process Response**: Transform Graph API response to frontend format

#### Example API Call
```typescript
// Get Page Insights
GET https://graph.facebook.com/v18.0/{page-id}/insights
  ?metric=page_impressions,page_reach,page_engaged_users
  &period=day
  &since={timestamp}
  &until={timestamp}
  &access_token={access_token}

// Response
{
  "data": [
    {
      "name": "page_impressions",
      "period": "day",
      "values": [
        {
          "value": 1250,
          "end_time": "2024-01-01T00:00:00+0000"
        }
      ]
    }
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    }
  }
}
```

---

### 5. Meta Ads API Integration

#### Authentication
- **OAuth2 Flow**: Facebook OAuth2 (Meta Ads uses Facebook authentication)
- **Scopes**: `ads_read`, `ads_management`
- **Token Types**: Short-lived → Long-lived (60 days)
- **Token Storage**: Long-lived tokens stored in MongoDB (MetaAdsConnection model)

#### Configuration
```typescript
// backend/src/config/metaAds.ts
- App ID: META_ADS_APP_ID
- App Secret: META_ADS_APP_SECRET
- Redirect URI: http://localhost:3000/api/meta-ads/callback
- API Base URL: https://graph.facebook.com/v18.0
```

#### Service Architecture
```
metaAdsAuthService (Authentication)
├── generateAuthUrl() - Creates Meta Ads OAuth URL
├── handleCallback() - Exchanges code for tokens
├── exchangeForLongLivedToken() - Converts to long-lived token
├── saveConnection() - Stores tokens in MongoDB
├── getConnectionByProject() - Retrieves connection
├── refreshAccessToken() - Refreshes long-lived token
└── getAdAccounts() - Lists accessible ad accounts (with pagination)

metaAdsDataService (Data Extraction)
├── getAccessToken() - Gets valid access token
├── getAccountInsights() - Fetches account-level metrics
├── getCampaignInsights() - Fetches campaign performance
├── getAdSetInsights() - Fetches ad set performance
└── getAdInsights() - Fetches individual ad performance
```

#### Data Extraction Process
1. **Get Access Token**: Retrieve from MetaAdsConnection
2. **List Ad Accounts**: Call `/me/adaccounts` endpoint (with pagination)
3. **Query Insights**: Use Insights API endpoints
4. **Handle Pagination**: Process cursor-based pagination
5. **Process Response**: Transform to frontend format

#### Example API Call
```typescript
// Get Ad Account Insights
GET https://graph.facebook.com/v18.0/{ad-account-id}/insights
  ?fields=impressions,clicks,spend,actions
  &time_range={"since":"2024-01-01","until":"2024-01-31"}
  &access_token={access_token}

// Response
{
  "data": [
    {
      "impressions": "12500",
      "clicks": "320",
      "spend": "1250.50",
      "actions": [
        {
          "action_type": "link_click",
          "value": "45"
        }
      ]
    }
  ],
  "paging": {
    "cursors": {...},
    "next": "https://graph.facebook.com/v18.0/..."
  }
}
```

---

### 6. Instagram Graph API Integration

#### Authentication
- **Dependency**: Requires Facebook connection (Instagram Business Accounts are linked to Facebook Pages)
- **Token Type**: Page Access Token (from Facebook Page)
- **Token Storage**: Uses FacebookConnection model

#### Configuration
```typescript
// Uses Facebook API configuration
- API Base URL: https://graph.facebook.com/v18.0
- Requires: Facebook Page Access Token
```

#### Service Architecture
```
instagramService (Data Extraction)
├── getPageAccessToken() - Gets Page Access Token from Facebook
├── getAccessToken() - Gets user access token (fallback)
├── getInstagramAccounts() - Lists Instagram Business Accounts (with pagination)
├── fetchAllUserInsights() - Fetches user-level insights (with time-based pagination)
├── fetchAllMedia() - Fetches all media posts (with cursor pagination)
└── getInsights() - Legacy method (backward compatibility)
```

#### Data Extraction Process
1. **Get Page Access Token**: Retrieve from FacebookConnection, fetch page-specific token
2. **List Instagram Accounts**: Call `/me/accounts` with `instagram_business_account` field
3. **Fetch Insights**: Use `/{ig-user-id}/insights` endpoint
   - **Time-based Pagination**: Split date ranges into 28-day chunks (API limit)
   - **Metrics**: `reach`, `profile_views`, `follower_count`, `website_clicks`, etc.
4. **Fetch Media**: Use `/{ig-user-id}/media` endpoint
   - **Cursor Pagination**: Use `paging.next` for pagination
   - **Fetch Insights per Media**: Call `/{media-id}/insights` for each media item
5. **Handle Rate Limits**: Implement exponential backoff retry logic
6. **Process Response**: Transform to frontend format

#### Rate Limiting & Retry Logic
```typescript
// Exponential backoff retry for rate limits
async function fetchWithRetry(url, options, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    // Check for HTTP 429 (rate limit)
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      const waitTime = retryAfter * 1000 || delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
}
```

#### Example API Call
```typescript
// Get Instagram User Insights
GET https://graph.facebook.com/v18.0/{ig-user-id}/insights
  ?metric=reach,profile_views,follower_count,website_clicks
  &period=day
  &metric_type=total_value
  &since={timestamp}
  &until={timestamp}
  &access_token={page_access_token}

// Response
{
  "data": [
    {
      "name": "reach",
      "period": "day",
      "values": [
        {
          "value": 1250,
          "end_time": "2024-01-01T00:00:00+0000"
        }
      ]
    }
  ],
  "paging": {
    "next": "https://graph.facebook.com/v18.0/..."
  }
}
```

---

## Data Extraction Mechanisms

### 1. Google Analytics 4 Data Extraction

#### Metrics Extracted
- **User Metrics**: `totalUsers`, `newUsers`, `activeUsers`
- **Session Metrics**: `sessions`, `engagedSessions`, `bounceRate`, `engagementRate`
- **Duration Metrics**: `averageSessionDuration`
- **Event Metrics**: `eventCount`, `conversions`
- **Revenue Metrics**: `totalRevenue`, `purchaseRevenue`, `averageRevenuePerUser`

#### Dimensions Extracted
- **Geographic**: `country`, `city`, `region`
- **Device**: `deviceCategory`, `operatingSystem`, `browser`
- **Traffic Source**: `sessionSource`, `sessionMedium`, `sessionCampaignName`, `sessionDefaultChannelGroup`
- **Content**: `landingPage`, `pagePath`, `pageTitle`
- **Time**: `date`, `hour`, `dayOfWeek`

#### Data Processing Pipeline
```
1. API Request
   ↓
2. Raw Response (GA4 Data API format)
   ↓
3. Transform Metrics
   - Convert percentages (0.5 → 50%)
   - Convert durations (seconds → minutes)
   - Parse numeric values
   ↓
4. Transform Dimensions
   - Map dimension values to readable names
   - Group by dimension values
   ↓
5. Cache Result (30 minutes TTL)
   ↓
6. Return to Frontend
```

#### Example: Overview Metrics Extraction
```typescript
// Request
metrics: [
  'totalUsers', 'sessions', 'engagementRate', 
  'averageSessionDuration', 'bounceRate', 'newUsers',
  'conversions', 'eventCount', 'engagedSessions', 'totalRevenue'
]

// Response Processing
{
  totalUsers: parseInt(row.metricValues[0].value),
  sessions: parseInt(row.metricValues[1].value),
  engagementRate: parseFloat(row.metricValues[2].value) * 100, // Convert to percentage
  averageSessionDuration: parseFloat(row.metricValues[3].value) / 60, // Convert to minutes
  bounceRate: parseFloat(row.metricValues[4].value) * 100,
  // ... etc
}
```

---

### 2. Google Ads Data Extraction

#### Metrics Extracted
- **Performance**: `impressions`, `clicks`, `cost`, `conversions`
- **Rates**: `ctr` (Click-Through Rate), `conversionRate`, `averageCpc` (Cost Per Click)
- **Efficiency**: `costPerConversion`, `averageCpm` (Cost Per Mille)
- **Engagement**: `interactions`, `interactionRate`

#### Dimensions Extracted
- **Geographic**: `user_location_view` (country-level performance)
- **Device**: `device` (Mobile, Desktop, Tablet)
- **Campaign**: `campaign.id`, `campaign.name`, `campaign.status`
- **Keywords**: `keyword_view` (keyword performance)

#### Data Processing Pipeline
```
1. List Accessible Customers
   ↓
2. For Each Customer:
   a. Query Customer Details (descriptive name, currency, timezone)
   b. Query Campaign Performance (GAQL)
   c. Query Keyword Performance (GAQL)
   d. Query Location Performance (GAQL)
   e. Query Device Performance (GAQL)
   ↓
3. Aggregate Data
   ↓
4. Transform to Frontend Format
   ↓
5. Return to Frontend
```

#### Example: Campaign Data Extraction
```typescript
// GAQL Query
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.ctr,
  metrics.average_cpc
FROM campaign
WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'

// Response Processing
{
  id: campaign.id,
  name: campaign.name,
  status: campaign.status,
  impressions: parseInt(metrics.impressions),
  clicks: parseInt(metrics.clicks),
  cost: parseFloat(metrics.cost_micros) / 1000000, // Convert micros to currency
  conversions: parseFloat(metrics.conversions),
  ctr: parseFloat(metrics.ctr) * 100, // Convert to percentage
  averageCpc: parseFloat(metrics.average_cpc) / 1000000
}
```

---

### 3. Facebook/Meta Ads Data Extraction

#### Metrics Extracted
- **Reach**: `impressions`, `reach`, `frequency`
- **Engagement**: `clicks`, `ctr`, `actions` (link clicks, post engagements)
- **Spend**: `spend`, `cpm`, `cpp` (Cost Per Purchase)
- **Conversions**: `conversions`, `cost_per_conversion`, `conversion_rate`

#### Dimensions Extracted
- **Time**: `date_start`, `date_stop`
- **Campaign**: `campaign.id`, `campaign.name`
- **Ad Set**: `adset.id`, `adset.name`
- **Ad**: `ad.id`, `ad.name`
- **Demographics**: `age`, `gender`, `country`

#### Data Processing Pipeline
```
1. List Ad Accounts (with pagination)
   ↓
2. For Each Ad Account:
   a. Query Account Insights
   b. Query Campaign Insights
   c. Query Ad Set Insights
   d. Query Ad Insights
   ↓
3. Handle Pagination (cursor-based)
   ↓
4. Aggregate Data
   ↓
5. Transform to Frontend Format
   ↓
6. Return to Frontend
```

#### Example: Account Insights Extraction
```typescript
// API Request
GET /{ad-account-id}/insights
  ?fields=impressions,clicks,spend,actions,ctr
  &time_range={"since":"2024-01-01","until":"2024-01-31"}
  &level=account

// Response Processing
{
  impressions: parseInt(data.impressions),
  clicks: parseInt(data.clicks),
  spend: parseFloat(data.spend),
  ctr: parseFloat(data.ctr) * 100,
  conversions: extractActionValue(data.actions, 'conversion'),
  costPerConversion: calculateCostPerConversion(data.spend, conversions)
}
```

---

### 4. Instagram Data Extraction

#### Metrics Extracted
- **Reach & Impressions**: `reach`, `impressions`
- **Profile**: `profile_views`, `follower_count`, `website_clicks`
- **Engagement**: `accounts_engaged`, `total_interactions`, `likes`, `comments`, `shares`, `saves`
- **Profile Actions**: `profile_links_taps`

#### Data Types Extracted
- **User Insights**: Time-series data (daily metrics)
- **Lifetime Insights**: Aggregate lifetime metrics
- **Audience Demographics**: Age, gender, location breakdowns
- **Media Insights**: Individual post/reel performance

#### Data Processing Pipeline
```
1. Get Page Access Token
   ↓
2. List Instagram Business Accounts
   ↓
3. For Each Account:
   a. Fetch User Insights (split into 28-day chunks)
      - Process time-series data
      - Aggregate metrics by date
   b. Fetch Lifetime Insights
   c. Fetch Audience Demographics
   d. Fetch Media (with pagination)
      - For each media item:
        - Fetch media insights
        - Attach insights to media object
   ↓
4. Handle Rate Limits (exponential backoff)
   ↓
5. Transform to Frontend Format
   ↓
6. Return to Frontend
```

#### Example: User Insights Extraction
```typescript
// API Request (28-day chunk)
GET /{ig-user-id}/insights
  ?metric=reach,profile_views,follower_count,website_clicks,accounts_engaged
  &period=day
  &metric_type=total_value
  &since={timestamp}
  &until={timestamp}

// Response Processing
// Group metrics by date
const metricsMap = new Map();
for (const metric of response.data) {
  for (const value of metric.values) {
    const date = value.end_time.split('T')[0];
    if (!metricsMap.has(date)) {
      metricsMap.set(date, {});
    }
    metricsMap.get(date)[metric.name] = value.value;
  }
}

// Transform to time series array
const timeSeries = Array.from(metricsMap.entries()).map(([date, metrics]) => ({
  date,
  reach: metrics.reach || 0,
  profile_views: metrics.profile_views || 0,
  // ... etc
}));
```

---

## Data Flow Diagrams

### Complete Data Flow: User Request → Analytics Display

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                           │
│  1. User selects project                                            │
│  2. User selects date range (7 days, 30 days, custom)              │
│  3. User clicks "View Analytics"                                   │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                             │
│  - AnalyticsPage component                                         │
│  - DateRangePicker component                                        │
│  - Calls analyticsService.getOverviewMetrics()                     │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ HTTP GET Request
                              │ /api/analytics/overview
                              │ ?projectId=xxx&startDate=xxx&endDate=xxx
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND ROUTE HANDLER                          │
│  Route: /api/analytics/overview                                     │
│  Handler: analyticsController.getOverviewMetrics()                │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ Calls
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANALYTICS SERVICE LAYER                          │
│  analyticsService.getOverviewMetrics()                             │
│  1. Check cache (AnalyticsCache model)                             │
│  2. If cache hit → return cached data                              │
│  3. If cache miss → proceed to data extraction                    │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ Cache Miss
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GA DATA SERVICE LAYER                            │
│  gaDataService.getAccessToken(projectId)                           │
│  1. Query GAConnection model                                       │
│  2. Check if access token expired                                  │
│  3. If expired → refresh using refresh token                      │
│  4. Return valid access token                                       │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ Access Token
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GA DATA SERVICE LAYER                            │
│  gaDataService.runReport()                                         │
│  1. Initialize BetaAnalyticsDataClient                             │
│  2. Build report request:                                          │
│     - Property ID: properties/{propertyId}                        │
│     - Metrics: ['totalUsers', 'sessions', ...]                    │
│     - Dimensions: []                                              │
│     - Date Ranges: [{startDate, endDate}]                         │
│  3. Execute API call                                               │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ HTTPS Request
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE ANALYTICS 4 API                           │
│  POST https://analyticsdata.googleapis.com/v1beta/                 │
│      properties/{propertyId}:runReport                            │
│  Headers:                                                          │
│    Authorization: Bearer {access_token}                             │
│  Body:                                                             │
│    {metrics: [...], dimensions: [...], dateRanges: [...]}         │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ JSON Response
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GA DATA SERVICE LAYER                            │
│  Process Response:                                                 │
│  - Extract metric values from rows                                 │
│  - Convert percentages (0.5 → 50%)                                │
│  - Convert durations (seconds → minutes)                          │
│  - Parse numeric values                                            │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ Processed Data
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANALYTICS SERVICE LAYER                          │
│  analyticsService.cacheData()                                      │
│  1. Store in AnalyticsCache model                                 │
│  2. Set expiration: 30 minutes from now                           │
│  3. Upsert (update if exists, create if not)                      │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ Cached & Processed Data
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND CONTROLLER                             │
│  Return JSON response to frontend                                  │
│  {                                                                 │
│    totalUsers: 1250,                                               │
│    sessions: 2100,                                                │
│    engagementRate: 65.5,                                           │
│    ...                                                              │
│  }                                                                 │
└────────────────────────────┬────────────────────────────────────────┘
                              │
                              │ HTTP Response
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                             │
│  - Receive data in analyticsService                                │
│  - Update component state                                          │
│  - Render charts (Recharts)                                        │
│  - Render metric cards                                             │
│  - Display data tables                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security & Authentication

### Authentication Flow

#### 1. User Authentication (JWT)
- **Method**: JWT tokens stored in httpOnly cookies
- **Security**: 
  - httpOnly prevents XSS attacks
  - SameSite prevents CSRF attacks
  - Secure flag (in production) ensures HTTPS-only
- **Token Expiration**: Configurable (default: 7 days)

#### 2. OAuth2 Authentication (External APIs)
- **Flow**: Authorization Code Flow (most secure)
- **Token Storage**: 
  - Access tokens: Stored in MongoDB (encrypted at rest)
  - Refresh tokens: Stored in MongoDB (encrypted at rest)
- **Token Refresh**: Automatic refresh when access tokens expire

### Security Measures

1. **Password Hashing**: bcryptjs with salt rounds (10)
2. **Input Validation**: Express validators, Zod schemas
3. **SQL Injection Prevention**: Mongoose parameterized queries
4. **XSS Prevention**: React automatically escapes content
5. **CSRF Protection**: SameSite cookie attribute
6. **Rate Limiting**: Implemented for API endpoints (future enhancement)
7. **Environment Variables**: Sensitive data stored in `.env` files (not committed)

---

## Database Schema

### MongoDB Collections

#### 1. **Users Collection**
```typescript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  role: String (enum: ['admin', 'hotel_manager'], default: 'hotel_manager'),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Projects Collection**
```typescript
{
  _id: ObjectId,
  name: String (required),
  websiteUrl: String (required),
  gaPropertyId: String (optional),
  googleAdsCustomerId: String (optional),
  searchConsoleSiteUrl: String (optional),
  facebookPageId: String (optional),
  metaAdsAccountId: String (optional),
  instagram: {
    igUserId: String (optional),
    igUsername: String (optional),
    pageId: String (optional),
    accessToken: String (optional),
    connectedAt: Date (optional)
  },
  userId: ObjectId (ref: 'User', required),
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **GAConnection Collection**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required),
  refreshToken: String (required),
  accessToken: String (required),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **GoogleAdsConnection Collection**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required),
  refreshToken: String (required),
  accessToken: String (required),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **FacebookConnection Collection**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required),
  refreshToken: String (required),
  accessToken: String (required),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **MetaAdsConnection Collection**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required),
  refreshToken: String (required),
  accessToken: String (required),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. **GoogleSearchConsoleConnection Collection**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required),
  refreshToken: String (required),
  accessToken: String (required),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. **AnalyticsCache Collection**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required),
  reportType: String (required), // 'overview', 'sessionChannels', etc.
  dateRange: String (required), // '2024-01-01_2024-01-31'
  data: Object (required), // Cached analytics data
  expiresAt: Date (required), // TTL: 30 minutes
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{projectId: 1, reportType: 1, dateRange: 1}` - Unique compound index
- `{expiresAt: 1}` - TTL index for automatic expiration

---

## Caching Strategy

### Cache Implementation

#### 1. **Analytics Cache (MongoDB)**
- **Purpose**: Reduce API calls to external services
- **TTL**: 30 minutes
- **Key**: `{projectId, reportType, dateRange}`
- **Storage**: MongoDB AnalyticsCache collection

#### 2. **Cache Flow**
```
1. Request received
   ↓
2. Check cache
   ├─ Cache Hit & Not Expired → Return cached data
   └─ Cache Miss or Expired → Fetch from API → Cache → Return
```

#### 3. **Cache Invalidation**
- **Time-based**: Automatic expiration after 30 minutes
- **Manual**: Clear cache on project update (future enhancement)

#### 4. **Cache Benefits**
- **Performance**: Faster response times for repeated queries
- **Cost**: Reduced API quota usage
- **Reliability**: Fallback to cached data if API fails

---

## Error Handling & Resilience

### Error Handling Strategy

#### 1. **Frontend Error Handling**
- **API Errors**: Display user-friendly error messages
- **Network Errors**: Retry logic with exponential backoff
- **Validation Errors**: Form-level error display

#### 2. **Backend Error Handling**
- **Middleware**: Global error handler (`errorMiddleware.ts`)
- **Error Types**:
  - **Validation Errors**: 400 Bad Request
  - **Authentication Errors**: 401 Unauthorized
  - **Authorization Errors**: 403 Forbidden
  - **Not Found Errors**: 404 Not Found
  - **API Errors**: 502 Bad Gateway (external API failures)
  - **Server Errors**: 500 Internal Server Error

#### 3. **Resilience Mechanisms**

**Token Refresh:**
- Automatic refresh when access tokens expire
- Retry logic for failed refresh attempts

**Rate Limiting:**
- Exponential backoff for rate-limited APIs (Instagram, Facebook)
- Retry-After header support

**Partial Failures:**
- `Promise.allSettled()` for parallel API calls
- Graceful degradation (return partial data if some APIs fail)

**Connection Timeouts:**
- Request timeouts for external API calls
- Fallback to cached data if API unavailable

---

## API Endpoints Summary

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Project Endpoints
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Google Analytics Endpoints
- `GET /api/google/auth` - Initiate OAuth flow
- `GET /api/google/callback` - OAuth callback
- `GET /api/google/properties` - List GA4 properties

### Google Ads Endpoints
- `GET /api/google-ads/auth` - Initiate OAuth flow
- `GET /api/google-ads/callback` - OAuth callback
- `GET /api/google-ads/customers` - List accessible customers

### Google Search Console Endpoints
- `GET /api/gsc/auth` - Initiate OAuth flow
- `GET /api/gsc/callback` - OAuth callback
- `GET /api/gsc/sites` - List verified sites

### Facebook Endpoints
- `GET /api/facebook/auth` - Initiate OAuth flow
- `GET /api/facebook/callback` - OAuth callback
- `GET /api/facebook/pages` - List Facebook pages

### Meta Ads Endpoints
- `GET /api/meta-ads/auth` - Initiate OAuth flow
- `GET /api/meta-ads/callback` - OAuth callback
- `GET /api/meta-ads/accounts` - List ad accounts

### Instagram Endpoints
- `GET /api/instagram/accounts` - List Instagram Business Accounts
- `GET /api/instagram/insights` - Get Instagram insights
- `GET /api/instagram/media` - Get Instagram media

### Analytics Endpoints
- `GET /api/analytics/overview` - Get overview metrics
- `GET /api/analytics/channels` - Get session channels
- `GET /api/analytics/conversions` - Get conversions by channel
- `GET /api/analytics/geo` - Get geographic data
- `GET /api/analytics/devices` - Get device data
- `GET /api/analytics/landing-pages` - Get top landing pages
- `GET /api/analytics/sources` - Get session sources
- `GET /api/analytics/browsers` - Get browser data
- `GET /api/analytics/campaigns` - Get campaign data
- `GET /api/analytics/revenue` - Get revenue metrics
- `GET /api/analytics/time-based` - Get time-based analytics

---

## Conclusion

The Hotel Analytics Cockpit is a comprehensive multi-platform analytics aggregation system that:

1. **Unifies Data**: Aggregates analytics from 6+ platforms into a single dashboard
2. **Secure Authentication**: Implements OAuth2 for all external APIs with secure token storage
3. **Efficient Data Extraction**: Uses caching, pagination, and parallel requests for optimal performance
4. **Resilient Architecture**: Handles errors gracefully with retry logic and fallback mechanisms
5. **Scalable Design**: Modular architecture allows easy addition of new platforms

The system provides hotel managers with a unified view of their marketing performance across all channels, enabling data-driven decision-making.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: System Architecture Documentation

