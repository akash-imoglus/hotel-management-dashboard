import MetaAdsConnection from '../models/MetaAdsConnection';
import metaAdsAuthService from './metaAdsAuthService';
import { META_ADS_API_BASE_URL } from '../config/metaAds';
import { Types } from 'mongoose';

export interface IMetaAdsDataService {
  getAccessToken(projectId: string): Promise<string>;
  getInsights(accountId: string, accessToken: string, dateRange: { startDate: string; endDate: string }): Promise<any>;
}

class MetaAdsDataService implements IMetaAdsDataService {
  public async getAccessToken(projectId: string): Promise<string> {
    const connection = await MetaAdsConnection.findOne({ projectId: new Types.ObjectId(projectId) });

    if (!connection) {
      throw new Error('Meta Ads connection not found for this project');
    }

    // Check if access token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = connection.expiresAt || new Date(0);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (!connection.accessToken || expiresAt < fiveMinutesFromNow) {
      console.log('[Meta Ads Data Service] Access token expired or missing, refreshing...');
      const { accessToken, expiresAt: newExpiresAt } = await metaAdsAuthService.refreshAccessToken(connection.refreshToken);
      
      // Update connection with new token
      // Convert null to undefined to match the interface type (Date | undefined)
      connection.accessToken = accessToken;
      connection.expiresAt = newExpiresAt ?? undefined;
      await connection.save();

      return accessToken;
    }

    return connection.accessToken;
  }

  public async getInsights(
    accountId: string,
    accessToken: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<any> {
    console.log(`[Meta Ads Data Service] Fetching insights for account: ${accountId}`);
    console.log(`[Meta Ads Data Service] Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
    
    // TODO: Implement actual Meta Ads Insights API fetching
    // Query insights endpoint: /act_{account_id}/insights
    // Metrics: impressions, clicks, spend, reach, actions, etc.
    
    // Mock data for insights
    return {
      impressions: 1250000,
      clicks: 25000,
      spend: 15000.50,
      reach: 890000,
      actions: 1500,
      ctr: 2.0,
      cpc: 0.60,
      cpm: 12.00,
      conversions: 120,
      conversionRate: 0.48,
      costPerConversion: 125.00,
    };
  }
}

export default new MetaAdsDataService();

