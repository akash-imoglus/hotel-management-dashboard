import gaDataService from './gaDataService';
import AnalyticsCache from '../models/AnalyticsCache';
import { Types } from 'mongoose';

export interface IAnalyticsService {
  getOverviewMetrics(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getSessionChannels(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getConversionsByChannel(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getGeoData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getDeviceData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getTopLandingPages(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getSessionSources(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getBrowserData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getCampaignData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getSourceMediumCampaign(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getRevenueMetrics(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getTimeBasedAnalytics(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any>;
  getCachedData(projectId: string, reportType: string, dateRange: string): Promise<any>;
  cacheData(projectId: string, reportType: string, dateRange: string, data: any): Promise<void>;
}

class AnalyticsService implements IAnalyticsService {
  private CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  public async getCachedData(projectId: string, reportType: string, dateRange: string): Promise<any> {
    const cacheEntry = await AnalyticsCache.findOne({
      projectId: new Types.ObjectId(projectId),
      reportType,
      dateRange,
      expiresAt: { $gt: new Date() },
    });

    return cacheEntry ? cacheEntry.data : null;
  }

  public async cacheData(projectId: string, reportType: string, dateRange: string, data: any): Promise<void> {
    const expiresAt = new Date(Date.now() + this.CACHE_DURATION);

    await AnalyticsCache.findOneAndUpdate(
      {
        projectId: new Types.ObjectId(projectId),
        reportType,
        dateRange,
      },
      {
        projectId: new Types.ObjectId(projectId),
        reportType,
        dateRange,
        data,
        expiresAt,
      },
      {
        upsert: true,
        new: true,
      }
    );
  }

  public async getOverviewMetrics(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'overview';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Split metrics into two requests (max 10 metrics per request)
    // First request: Core metrics (10 metrics)
    const metrics1 = [
      'totalUsers',
      'sessions',
      'engagementRate',
      'averageSessionDuration',
      'bounceRate',
      'newUsers',
      'conversions',
      'eventCount',
      'engagedSessions',
      'totalRevenue',
    ];

    // Second request: Additional revenue metrics (2 metrics)
    const metrics2 = [
      'purchaseRevenue',
      'averageRevenuePerUser',
    ];

    console.log(`Fetching overview metrics for property ${propertyId} from ${startDate} to ${endDate}`);

    // Run both reports in parallel
    const [response1, response2] = await Promise.all([
      gaDataService.runReport(
        propertyId,
        accessToken,
        [],
        metrics1,
        [{ startDate, endDate }]
      ),
      gaDataService.runReport(
        propertyId,
        accessToken,
        [],
        metrics2,
        [{ startDate, endDate }]
      ),
    ]);

    // Process data - handle empty responses (common for newly added properties)
    // Transform to match frontend OverviewMetrics interface: { totalUsers, sessions, pageviews, bounceRate }
    let metricValues: { [key: string]: number } = {};
    
    // Process first response
    const allMetrics = [...metrics1, ...metrics2];
    
    if (!response1.rows || response1.rows.length === 0) {
      console.warn(`No data returned for property ${propertyId} - property may be new or have no data in date range`);
      // Return zeros for all metrics
      allMetrics.forEach(metric => {
        metricValues[metric] = 0;
      });
    } else {
      // Extract metric values from first response
      const row1 = response1.rows[0];
      if (row1?.metricValues) {
        row1.metricValues.forEach((metric: any, index: number) => {
          const metricName = metrics1[index];
          // Convert string values to numbers, handle percentages and durations
          let value = parseFloat(metric.value || '0');
          
          // Handle percentage metrics (engagementRate, bounceRate)
          if (metricName === 'engagementRate' || metricName === 'bounceRate') {
            value = value * 100; // Convert to percentage (0.5 -> 50)
          }
          
          // Handle duration metrics (averageSessionDuration is in seconds)
          if (metricName === 'averageSessionDuration') {
            value = value / 60; // Convert to minutes
          }
          
          metricValues[metricName] = isNaN(value) ? 0 : value;
        });
      }
    }

    // Process second response
    if (response2.rows && response2.rows.length > 0) {
      const row2 = response2.rows[0];
      if (row2?.metricValues) {
        row2.metricValues.forEach((metric: any, index: number) => {
          const metricName = metrics2[index];
          const value = parseFloat(metric.value || '0');
          metricValues[metricName] = isNaN(value) ? 0 : value;
        });
      }
    }
    
    // Ensure all metrics are present (fill missing ones with 0)
    allMetrics.forEach(metric => {
      if (!(metric in metricValues)) {
        metricValues[metric] = 0;
      }
    });

    // Transform to frontend format - comprehensive metrics like DM Cockpit
    const data = {
      totalUsers: metricValues.totalUsers || 0,
      sessions: metricValues.sessions || 0,
      pageviews: metricValues.eventCount || 0, // Using eventCount as pageviews
      bounceRate: metricValues.bounceRate || 0,
      // Behavioral metrics
      engagementRate: metricValues.engagementRate || 0,
      averageSessionDuration: metricValues.averageSessionDuration || 0,
      engagedSessions: metricValues.engagedSessions || 0,
      // User metrics
      newUsers: metricValues.newUsers || 0,
      // Conversion metrics
      conversions: metricValues.conversions || 0,
      // Revenue metrics
      totalRevenue: metricValues.totalRevenue || 0,
      purchaseRevenue: metricValues.purchaseRevenue || 0,
      averageRevenuePerUser: metricValues.averageRevenuePerUser || 0,
    };

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, data);

    return data;
  }

  public async getSessionChannels(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'sessionChannels';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics - comprehensive metrics for DM Cockpit format
    const dimensions = ['sessionDefaultChannelGroup'];
    // Split into two requests due to 10 metric limit
    const metrics1 = ['totalUsers', 'sessions', 'bounceRate', 'averageSessionDuration', 'totalRevenue'];
    const metrics2 = ['conversions', 'eventCount', 'engagementRate', 'engagedSessions', 'newUsers'];

    // Run both reports in parallel - use allSettled to handle partial failures
    const [result1, result2] = await Promise.allSettled([
      gaDataService.runReport(
        propertyId,
        accessToken,
        dimensions,
        metrics1,
        [{ startDate, endDate }]
      ),
      gaDataService.runReport(
        propertyId,
        accessToken,
        dimensions,
        metrics2,
        [{ startDate, endDate }]
      ),
    ]);

    // Extract responses or handle errors
    const response1 = result1.status === 'fulfilled' ? result1.value : null;
    const response2 = result2.status === 'fulfilled' ? result2.value : null;

    // Log any failures
    if (result1.status === 'rejected') {
      console.error(`Failed to fetch metrics1 for channels (property ${propertyId}):`, result1.reason);
    }
    if (result2.status === 'rejected') {
      console.error(`Failed to fetch metrics2 for channels (property ${propertyId}):`, result2.reason);
    }

    // Process data - combine both responses
    const channelMap = new Map<string, any>();
    
    // Process first response
    if (response1?.rows && response1.rows.length > 0) {
      console.log(`Processing ${response1.rows.length} rows from metrics1 for property ${propertyId}`);
      response1.rows.forEach((row: any) => {
        const channel = row.dimensionValues?.[0]?.value || 'Unknown';
        channelMap.set(channel, {
          channel,
          totalUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
          sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
          bounceRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
          averageSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0') / 60, // Convert to minutes
          totalRevenue: parseFloat(row.metricValues?.[4]?.value || '0'),
        });
      });
    } else {
      console.warn(`No rows in response1 for property ${propertyId}`);
    }

    // Process second response and merge
    if (response2?.rows && response2.rows.length > 0) {
      console.log(`Processing ${response2.rows.length} rows from metrics2 for property ${propertyId}`);
      response2.rows.forEach((row: any) => {
        const channel = row.dimensionValues?.[0]?.value || 'Unknown';
        const existing = channelMap.get(channel) || { channel };
        channelMap.set(channel, {
          ...existing,
          conversions: parseInt(row.metricValues?.[0]?.value || '0', 10),
          eventCount: parseInt(row.metricValues?.[1]?.value || '0', 10),
          engagementRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
          engagedSessions: parseInt(row.metricValues?.[3]?.value || '0', 10),
          newUsers: parseInt(row.metricValues?.[4]?.value || '0', 10),
        });
      });
    } else {
      console.warn(`No rows in response2 for property ${propertyId}`);
    }

    // If we have channels from response2 but not response1, ensure they have default values
    if (channelMap.size === 0 && response2?.rows && response2.rows.length > 0) {
      console.warn(`Only response2 has data for property ${propertyId}, creating entries with default values`);
      response2.rows.forEach((row: any) => {
        const channel = row.dimensionValues?.[0]?.value || 'Unknown';
        if (!channelMap.has(channel)) {
          channelMap.set(channel, {
            channel,
            totalUsers: 0,
            sessions: 0,
            bounceRate: 0,
            averageSessionDuration: 0,
            totalRevenue: 0,
          });
        }
      });
    }

    const rows = Array.from(channelMap.values());
    
    // Log final result
    console.log(`Channel data for property ${propertyId}: ${rows.length} channels found`);
    if (rows.length > 0) {
      console.log(`Sample channel data:`, JSON.stringify(rows[0], null, 2));
    }
    
    // If no data, return empty array
    if (rows.length === 0) {
      console.warn(`No channel data returned for property ${propertyId}`);
      return rows;
    }

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, rows);

    return rows;
  }

  public async getConversionsByChannel(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'conversionsByChannel';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics
    const dimensions = ['sessionDefaultChannelGroup'];
    const metrics = ['conversions'];

    // Run report
    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    // Process data
    const data = {
      rows: response.rows?.map((row: any) => ({
        channel: row.dimensionValues?.[0]?.value || 'Unknown',
        conversions: row.metricValues?.[0]?.value || 0,
      })) || [],
    };

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, data);

    return data;
  }

  public async getGeoData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'geoData';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics
    const dimensions = ['country'];
    const metrics = ['totalUsers', 'sessions', 'bounceRate', 'averageSessionDuration'];

    // Run report
    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    // Process data - transform to match frontend GeoMetric[] format: { country: string, users: number, sessions: number }
    const rows = response.rows?.map((row: any) => ({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
    })) || [];
    
    // If no data, return empty array (don't cache empty data)
    if (rows.length === 0) {
      console.warn(`No geo data returned for property ${propertyId}`);
      return rows;
    }

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, rows);

    return rows;
  }

  public async getDeviceData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'deviceData';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics
    const dimensions = ['deviceCategory'];
    const metrics = ['totalUsers', 'sessions'];

    // Run report
    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    // Process data - transform to match frontend DeviceMetric[] format: { device: string, value: number }
    const rows = response.rows?.map((row: any) => ({
      device: row.dimensionValues?.[0]?.value || 'Unknown',
      value: parseInt(row.metricValues?.[1]?.value || '0', 10), // sessions as value
    })) || [];
    
    // If no data, return empty array (don't cache empty data)
    if (rows.length === 0) {
      console.warn(`No device data returned for property ${propertyId}`);
      return rows;
    }

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, rows);

    return rows;
  }

  public async getTopLandingPages(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'topLandingPages';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics
    const dimensions = ['landingPage'];
    const metrics = ['sessions', 'bounceRate', 'averageSessionDuration', 'conversions'];

    // Run report
    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    // Process data - transform to match frontend LandingPageMetric[] format: { pagePath: string, sessions: number }
    const rows = response.rows?.map((row: any) => {
      const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const conversions = parseInt(row.metricValues?.[3]?.value || '0', 10);
      return {
        pagePath: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions: sessions,
        conversionRate: sessions > 0 ? (conversions / sessions) * 100 : 0, // Calculate conversion rate
      };
    }) || [];
    
    // If no data, return empty array (don't cache empty data)
    if (rows.length === 0) {
      console.warn(`No landing page data returned for property ${propertyId}`);
      return rows;
    }

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, rows);

    return rows;
  }

  public async getSessionSources(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'sessionSources';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics
    const dimensions = ['sessionSource', 'sessionMedium'];
    const metrics = ['sessions', 'conversions'];

    // Run report
    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    // Process data
    const data = {
      rows: response.rows?.map((row: any) => ({
        source: row.dimensionValues?.[0]?.value || 'Unknown',
        medium: row.dimensionValues?.[1]?.value || 'Unknown',
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        conversions: parseInt(row.metricValues?.[1]?.value || '0', 10),
      })) || [],
    };

    // Cache the data
    await this.cacheData(projectId, reportType, dateRange, data);

    return data;
  }

  public async getBrowserData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'browserData';
    const dateRange = `${startDate}_${endDate}`;
    
    // Check cache first
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    // Get access token
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Define dimensions and metrics for browser performance
    const dimensions = ['browser'];
    const metrics = ['sessions', 'totalUsers', 'engagementRate', 'averageSessionDuration', 'bounceRate'];

    // Run report
    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    // Process data
    const rows = response.rows?.map((row: any) => ({
      browser: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      engagementRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
      averageSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0') / 60,
      bounceRate: parseFloat(row.metricValues?.[4]?.value || '0') * 100,
    })) || [];
    
    if (rows.length === 0) {
      console.warn(`No browser data returned for property ${propertyId}`);
      return rows;
    }

    await this.cacheData(projectId, reportType, dateRange, rows);
    return rows;
  }

  public async getCampaignData(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'campaignData';
    const dateRange = `${startDate}_${endDate}`;
    
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    const accessToken = await gaDataService.getAccessToken(projectId);
    const dimensions = ['sessionCampaignName'];
    const metrics = ['sessions', 'totalUsers', 'conversions', 'totalRevenue', 'engagementRate'];

    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    const rows = response.rows?.map((row: any) => ({
      campaign: row.dimensionValues?.[0]?.value || '(not set)',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      conversions: parseInt(row.metricValues?.[2]?.value || '0', 10),
      revenue: parseFloat(row.metricValues?.[3]?.value || '0'),
      engagementRate: parseFloat(row.metricValues?.[4]?.value || '0') * 100,
    })) || [];
    
    if (rows.length === 0) {
      console.warn(`No campaign data returned for property ${propertyId}`);
      return rows;
    }

    await this.cacheData(projectId, reportType, dateRange, rows);
    return rows;
  }

  public async getSourceMediumCampaign(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'sourceMediumCampaign';
    const dateRange = `${startDate}_${endDate}`;
    
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    const accessToken = await gaDataService.getAccessToken(projectId);
    const dimensions = ['sessionSource', 'sessionMedium', 'sessionCampaignName'];
    const metrics = ['sessions', 'totalUsers', 'conversions', 'totalRevenue', 'engagementRate', 'averageSessionDuration'];

    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      dimensions,
      metrics,
      [{ startDate, endDate }]
    );

    const rows = response.rows?.map((row: any) => ({
      source: row.dimensionValues?.[0]?.value || '(not set)',
      medium: row.dimensionValues?.[1]?.value || '(not set)',
      campaign: row.dimensionValues?.[2]?.value || '(not set)',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      conversions: parseInt(row.metricValues?.[2]?.value || '0', 10),
      revenue: parseFloat(row.metricValues?.[3]?.value || '0'),
      engagementRate: parseFloat(row.metricValues?.[4]?.value || '0') * 100,
      averageSessionDuration: parseFloat(row.metricValues?.[5]?.value || '0') / 60,
    })) || [];
    
    if (rows.length === 0) {
      console.warn(`No source/medium/campaign data returned for property ${propertyId}`);
      return rows;
    }

    await this.cacheData(projectId, reportType, dateRange, rows);
    return rows;
  }

  public async getRevenueMetrics(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'revenueMetrics';
    const dateRange = `${startDate}_${endDate}`;
    
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    const accessToken = await gaDataService.getAccessToken(projectId);
    const metrics = [
      'totalRevenue',
      'purchaseRevenue',
      'averageRevenuePerUser',
      'averagePurchaseRevenue',
      'totalPurchasers',
      'conversions',
    ];

    const response = await gaDataService.runReport(
      propertyId,
      accessToken,
      [],
      metrics,
      [{ startDate, endDate }]
    );

    let metricValues: { [key: string]: number } = {};
    
    if (!response.rows || response.rows.length === 0) {
      console.warn(`No revenue data returned for property ${propertyId}`);
      metrics.forEach(metric => {
        metricValues[metric] = 0;
      });
    } else {
      const row = response.rows[0];
      if (row?.metricValues) {
        row.metricValues.forEach((metric: any, index: number) => {
          const metricName = metrics[index];
          metricValues[metricName] = parseFloat(metric.value || '0');
        });
      }
      
      metrics.forEach(metric => {
        if (!(metric in metricValues)) {
          metricValues[metric] = 0;
        }
      });
    }

    const data = {
      totalRevenue: metricValues.totalRevenue || 0,
      purchaseRevenue: metricValues.purchaseRevenue || 0,
      averageRevenuePerUser: metricValues.averageRevenuePerUser || 0,
      averagePurchaseRevenue: metricValues.averagePurchaseRevenue || 0,
      totalPurchasers: metricValues.totalPurchasers || 0,
      conversions: metricValues.conversions || 0,
    };

    await this.cacheData(projectId, reportType, dateRange, data);
    return data;
  }

  public async getTimeBasedAnalytics(projectId: string, propertyId: string, startDate: string, endDate: string): Promise<any> {
    const reportType = 'timeBasedAnalytics';
    const dateRange = `${startDate}_${endDate}`;
    
    const cachedData = await this.getCachedData(projectId, reportType, dateRange);
    if (cachedData) {
      return cachedData;
    }

    const accessToken = await gaDataService.getAccessToken(projectId);

    // Get hour of day data
    const hourResponse = await gaDataService.runReport(
      propertyId,
      accessToken,
      ['hour'],
      ['sessions', 'totalUsers'],
      [{ startDate, endDate }]
    );

    // Get day of week data
    const dayResponse = await gaDataService.runReport(
      propertyId,
      accessToken,
      ['dayOfWeek'],
      ['sessions', 'totalUsers', 'engagementRate'],
      [{ startDate, endDate }]
    );

    const hourData = hourResponse.rows?.map((row: any) => ({
      hour: parseInt(row.dimensionValues?.[0]?.value || '0', 10),
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    })) || [];

    const dayData = dayResponse.rows?.map((row: any) => {
      const dayIndex = parseInt(row.dimensionValues?.[0]?.value || '0', 10);
      return {
        dayOfWeek: dayIndex,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex] || 'Unknown',
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        engagementRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
      };
    }) || [];

    const data = {
      byHour: hourData,
      byDayOfWeek: dayData,
    };

    await this.cacheData(projectId, reportType, dateRange, data);
    return data;
  }
}

export default new AnalyticsService();