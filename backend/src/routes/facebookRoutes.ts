import express from 'express';
import {
  initiateAuth,
  handleCallbackGet,
  saveFacebookPage,
  getFacebookPages,
  getFacebookOverview,
} from '../controllers/facebookController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (OAuth flow)
router.get('/auth', initiateAuth);
router.get('/callback', handleCallbackGet);

// Protected routes (require authentication)

// Protected routes (require authentication)
router.post('/page', authenticate, saveFacebookPage);
router.get('/pages/:projectId', authenticate, getFacebookPages);
router.get('/overview/:projectId', authenticate, getFacebookOverview);

export default router;

