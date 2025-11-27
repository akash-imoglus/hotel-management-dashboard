import FacebookConnection from '../models/FacebookConnection';
import facebookAuthService from './facebookAuthService';
import { FACEBOOK_API_BASE_URL } from '../config/facebook';
import { Types } from 'mongoose';

export interface IFacebookDataService {
  getAccessToken(projectId: string): Promise<string>;
  getOverviewMetrics(pageId: string, accessToken: string, dateRange: { startDate: string; endDate: string }): Promise<any>;
  getPageInsights(pageId: string, accessToken: string, dateRange: { startDate: string; endDate: string }): Promise<any>;
}

class FacebookDataService implements IFacebookDataService {
  public async getAccessToken(projectId: string): Promise<string> {
    const connection = await FacebookConnection.findOne({ projectId: new Types.ObjectId(projectId) });

    if (!connection) {
      throw new Error('Facebook connection not found for this project');
    }

    // Check if access token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = connection.expiresAt || new Date(0);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (!connection.accessToken || expiresAt < fiveMinutesFromNow) {
      console.log('[Facebook Data Service] Access token expired or missing, refreshing...');
      const { accessToken, expiresAt: newExpiresAt } = await facebookAuthService.refreshAccessToken(connection.refreshToken);
      
      // Update connection with new token
      // Convert null to undefined to match the interface type (Date | undefined)
      connection.accessToken = accessToken;
      connection.expiresAt = newExpiresAt ?? undefined;
      await connection.save();

      return accessToken;
    }

    return connection.accessToken;
  }

  public async getOverviewMetrics(
    pageId: string,
    accessToken: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<any> {
    console.log(`[Facebook Data Service] Fetching overview metrics for page: ${pageId}`);
    console.log(`[Facebook Data Service] Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
    
    // TODO: Implement actual Facebook Insights API overview metrics fetching
    // Query page insights with metrics like page_impressions, page_reach, page_engaged_users, etc.
    
    // Mock data for overview metrics
    return {
      pageImpressions: 125000,
      pageReach: 89000,
      pageEngagedUsers: 15000,
      pageLikes: 2500,
      pageFollowers: 3200,
      pagePostEngagements: 8500,
      pageVideoViews: 45000,
    };
  }

  public async getPageInsights(
    pageId: string,
    accessToken: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<any> {
    console.log(`[Facebook Data Service] Fetching page insights for page: ${pageId}`);
    console.log(`[Facebook Data Service] Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
    
    // TODO: Implement actual Facebook Insights API insights fetching
    // Query page insights with various metrics
    
    // Mock data for page insights
    return {
      impressions: [
        { date: dateRange.startDate, value: 5000 },
        { date: dateRange.endDate, value: 6000 },
      ],
      reach: [
        { date: dateRange.startDate, value: 3500 },
        { date: dateRange.endDate, value: 4200 },
      ],
      engagements: [
        { date: dateRange.startDate, value: 500 },
        { date: dateRange.endDate, value: 650 },
      ],
    };
  }
}

export default new FacebookDataService();

