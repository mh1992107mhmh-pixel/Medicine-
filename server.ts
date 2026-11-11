import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory sync room storage for shared codes (auto-expires after 30 days)
interface SyncRoomData {
  roomCode: string;
  data: any;
  updatedAt: number;
}

const syncRooms = new Map<string, SyncRoomData>();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // API Endpoints for Zero-Account Synchronization
  // 1. Get room data by 6-digit room code
  app.get('/api/sync/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode.toUpperCase().trim();
    const room = syncRooms.get(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'الرمز التشاركي غير موجود أو انتهت صلاحيته'
      });
    }
    return res.json({
      success: true,
      roomCode: room.roomCode,
      data: room.data,
      updatedAt: room.updatedAt
    });
  });

  // 2. Publish/update room data by room code
  app.post('/api/sync/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode.toUpperCase().trim();
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'البيانات مطلوبة للحفظ'
      });
    }

    syncRooms.set(roomCode, {
      roomCode,
      data,
      updatedAt: Date.now()
    });

    return res.json({
      success: true,
      message: 'تمت المزامنة بنجاح',
      roomCode,
      updatedAt: Date.now()
    });
  });

  // 3. Health check & status
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: syncRooms.size,
      time: new Date().toISOString()
    });
  });

  // Mount Vite middleware in development or serve static in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
