import { Router } from 'express';
import { socketService } from '../config/socket';

const router = Router();

// Get WebSocket connection statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = socketService.getConnectionStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get socket statistics',
      error: (error as Error).message
    });
  }
});

// Test WebSocket connection (for debugging)
router.post('/test', (_req, res) => {
  try {
    // Broadcast test message
    if (socketService.getConnectionStats().isInitialized) {
      // This would need to be implemented in socketService
      res.json({
        success: true,
        message: 'Test message sent',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'WebSocket service not initialized'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: (error as Error).message
    });
  }
});

export default router;
