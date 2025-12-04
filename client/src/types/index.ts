export type UserRole = "admin" | "hotel_manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user?: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  role: UserRole;
}

export interface Project {
  id?: string;
  _id?: string;
  name: string;
  websiteUrl: string;
  gaPropertyId?: string;
  googleAdsCustomerId?: string;
  googleAdsCurrency?: string;  // Currency code from Google Ads account
  searchConsoleSiteUrl?: string;
  youtubeChannelId?: string;
  facebookPageId?: string;
  metaAdsAccountId?: string;
  metaAdsCurrency?: string;  // Currency code from Meta Ads account
  googleSheetId?: string;
  googleDriveFolderId?: string;
  linkedinPageId?: string;
  googleBusinessProfileLocationId?: string;
  instagram?: {
    igUserId?: string;
    igUsername?: string;
    accessToken?: string;
    connectedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GA4Property {
  propertyId: string;
  displayName: string;
  propertyType: string;
}

export interface GoogleAdsCustomer {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
}

export interface OverviewMetrics {
  totalUsers: number;
  sessions: number;
  pageviews: number;
  bounceRate: number;
  screenPageViews?: number;
  sessionsPerUser?: number;
  // Additional metrics matching DM Cockpit
  engagementRate?: number;
  averageSessionDuration?: number;
  engagedSessions?: number;
  newUsers?: number;
  conversions?: number;
  totalRevenue?: number;
  purchaseRevenue?: number;
  averageRevenuePerUser?: number;
  // Comparison data - percentage change from previous period
  totalUsersChange?: number;
  sessionsChange?: number;
  pageviewsChange?: number;
  bounceRateChange?: number;
  engagementRateChange?: number;
  averageSessionDurationChange?: number;
  engagedSessionsChange?: number;
  newUsersChange?: number;
  conversionsChange?: number;
  totalRevenueChange?: number;
  purchaseRevenueChange?: number;
  averageRevenuePerUserChange?: number;
}

export interface ChannelMetric {
  channel?: string;
  sessionDefaultChannelGroup?: string;
  value?: number;
  totalUsers?: number;
  sessions?: number;
  bounceRate?: number;
  averageSessionDuration?: number;
  conversions?: number;
  totalRevenue?: number;
  eventCount?: number;
  engagementRate?: number;
  engagedSessions?: number;
  newUsers?: number;
  // Comparison data - percentage change from previous period
  totalUsersChange?: number;
  sessionsChange?: number;
  bounceRateChange?: number;
  averageSessionDurationChange?: number;
  conversionsChange?: number;
  totalRevenueChange?: number;
  eventCountChange?: number;
  engagementRateChange?: number;
  engagedSessionsChange?: number;
  newUsersChange?: number;
}

export interface DeviceMetric {
  device: string;
  deviceCategory?: string;
  value: number;
  sessions?: number;
  activeUsers?: number;
}

export interface GeoMetric {
  country: string;
  countryCode?: string;
  totalUsers: number;
  users?: number;
  sessions: number;
  activeUsers?: number;
}

export interface LandingPageMetric {
  pagePath: string;
  landingPage?: string;
  sessions: number;
  totalUsers?: number;
  bounceRate?: number;
  averageSessionDuration?: number;
  conversionRate?: number;
}

export interface SessionSourceMediumMetric {
  source: string;
  medium: string;
  totalUsers: number;
  sessions: number;
  conversions: number;
}

export interface GoogleAdsCampaignMetric {
  campaignName: string;
  clicks: number;
  cost: number;
  googleAdsConversions: number;
  conversions: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface GoogleSearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token?: string;
}

export interface FacebookOverviewMetrics {
  pageImpressions: number;
  pageReach: number;
  pageEngagedUsers: number;
  pageLikes: number;
  pageFollowers: number;
  pagePostEngagements: number;
  pageVideoViews: number;
}

export interface MetaAdsAccount {
  account_id: string;
  id: string;
  name: string;
  currency: string;
  timezone_name?: string;
  account_status?: number;
}

export interface MetaAdsInsights {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  actions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
  frequency: number;
}

export interface InstagramBusinessAccount {
  igUserId: string;
  igUsername: string;
  pageId: string;
  pageName: string;
}

export interface InstagramInsights {
  lifetime?: {
    reach?: number;
    profile_views?: number;
    follower_count?: number;
    website_clicks?: number;
    accounts_engaged?: number;
    total_interactions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    profile_links_taps?: number;
  };
  days_28?: {
    reach?: number;
    profile_views?: number;
    follower_count?: number;
    website_clicks?: number;
    accounts_engaged?: number;
    total_interactions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    profile_links_taps?: number;
  };
  audience?: {
    city?: Array<{ value: string; count: number }>;
    country?: Array<{ value: string; count: number }>;
    demographics?: Array<{ value: string; count: number }>;
    reached?: Array<{ value: string; count: number }>;
  };
  timeSeries?: Array<{
    date: string;
    reach?: number;
    profile_views?: number;
    follower_count?: number;
    website_clicks?: number;
    accounts_engaged?: number;
    total_interactions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    profile_links_taps?: number;
  }>;
}

export interface SearchConsoleOverview {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsolePage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleCountry {
  country: string;
  countryCode: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleDevice {
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// Google Sheets types
export interface GoogleSpreadsheet {
  spreadsheetId: string;
  title: string;
  sheetCount: number;
  locale?: string;
  timeZone?: string;
  url: string;
}

export interface GoogleSheet {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SpreadsheetDetails {
  spreadsheetId: string;
  title: string;
  locale: string;
  timeZone: string;
  sheets: GoogleSheet[];
  url: string;
}

// Google Drive types
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface GoogleDriveStorageQuota {
  limit: string;
  usage: string;
  usageInDrive: string;
  usageInTrash: string;
}

export interface GoogleDriveStats {
  totalFiles: number;
  totalFolders: number;
  recentFiles: GoogleDriveFile[];
  storageQuota: GoogleDriveStorageQuota;
}

