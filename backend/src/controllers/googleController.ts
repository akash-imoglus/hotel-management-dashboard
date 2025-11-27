import { Request, Response } from 'express';
import gaAuthService from '../services/gaAuthService';
import projectService from '../services/projectService';
import asyncHandler from 'express-async-handler';
import gaDataService from '../services/gaDataService';

export const initiateAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const state = projectId ? String(projectId) : undefined;
    
    console.log(`[GA Initiate Auth] Request received`);
    console.log(`[GA Initiate Auth] Project ID: ${projectId}`);
    console.log(`[GA Initiate Auth] State: ${state}`);
    console.log(`[GA Initiate Auth] Redirect URL configured: ${process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/api/google/callback'}`);
    
    const authUrl = gaAuthService.generateAuthUrl(state);
    
    console.log(`[GA Initiate Auth] Generated auth URL (first 150 chars): ${authUrl.substring(0, 150)}...`);
    
    res.status(200).json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error: any) {
    console.error(`[GA Initiate Auth] Error:`, error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Test endpoint to verify callback route is accessible
export const testCallbackRoute = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Callback route is accessible',
    query: req.query,
  });
});

// GET callback handler for OAuth redirect
export const handleCallbackGet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log(`[GA OAuth Callback] Callback route hit!`);
  console.log(`[GA OAuth Callback] Query params:`, req.query);
  console.log(`[GA OAuth Callback] Full URL:`, req.url);
  
  const { code, state, error } = req.query;

  if (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google-analytics/callback?error=${encodeURIComponent(String(error))}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google-analytics/callback?error=missing_code_or_state`);
    return;
  }

  const projectId = String(state);

  try {
    console.log(`[GA OAuth Callback] Processing callback for project: ${projectId}`);
    
    // Handle OAuth callback
    const { accessToken, refreshToken, expiresAt } = await gaAuthService.handleCallback(String(code));
    console.log(`[GA OAuth Callback] Tokens received - Access token: ${accessToken ? 'Yes' : 'No'}, Refresh token: ${refreshToken ? 'Yes' : 'No'}`);

    // Save connection
    console.log(`[GA OAuth Callback] Saving connection to database...`);
    const savedConnection = await gaAuthService.saveConnection(projectId, refreshToken, accessToken, expiresAt);
    console.log(`[GA OAuth Callback] Connection saved successfully - ID: ${savedConnection._id}, Project ID: ${savedConnection.projectId}`);

    // Verify the connection was saved
    const verifyConnection = await gaAuthService.getConnectionByProject(projectId);
    if (!verifyConnection) {
      console.error(`[GA OAuth Callback] ERROR: Connection was not found after save!`);
      throw new Error('Failed to verify connection was saved');
    }
    console.log(`[GA OAuth Callback] Connection verified in database`);

    // Redirect to frontend callback page with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google-analytics/callback?ga_connected=${projectId}`);
  } catch (error: any) {
    console.error(`[GA OAuth Callback] ERROR:`, error);
    console.error(`[GA OAuth Callback] Error stack:`, error.stack);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google-analytics/callback?error=${encodeURIComponent(error.message)}`);
  }
});

// POST callback handler for manual callback
export const handleCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { code, projectId } = req.body;

  if (!code || !projectId) {
    res.status(400).json({
      success: false,
      error: 'Authorization code and project ID are required',
    });
    return;
  }

  try {
    // @ts-ignore
    const userId = req.user._id.toString();
    
    // Verify project belongs to user
    const project = await projectService.getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    // Handle OAuth callback
    const { accessToken, refreshToken, expiresAt } = await gaAuthService.handleCallback(code);

    // Save connection
    await gaAuthService.saveConnection(projectId, refreshToken, accessToken, expiresAt);

    res.status(200).json({
      success: true,
      data: {
        message: 'Google Analytics connection established successfully',
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export const saveGaProperty = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId, propertyId } = req.body;

  if (!projectId || !propertyId) {
    res.status(400).json({
      success: false,
      error: 'Project ID and Property ID are required',
    });
    return;
  }

  try {
    // @ts-ignore
    const userId = req.user._id.toString();
    
    // Verify project belongs to user
    const project = await projectService.getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    // Update project with GA property ID
    const updatedProject = await projectService.updateProject(projectId, userId, {
      gaPropertyId: propertyId,
    });

    if (!updatedProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    // Ensure gaPropertyId is included in response
    const projectData = updatedProject.toObject ? updatedProject.toObject() : updatedProject;
    
    res.status(200).json({
      success: true,
      data: {
        ...projectData,
        gaPropertyId: propertyId, // Explicitly include to ensure it's in response
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export const getGA4Properties = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;

  if (!projectId) {
    res.status(400).json({
      success: false,
      error: 'Project ID is required',
    });
    return;
  }

  try {
    // @ts-ignore
    const userId = req.user._id.toString();
    
    // Verify project belongs to user
    const project = await projectService.getProjectById(projectId, userId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    // Get access token for this project
    const accessToken = await gaDataService.getAccessToken(projectId);

    // Fetch GA4 properties
    const properties = await gaAuthService.getGA4Properties(accessToken);

    res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});