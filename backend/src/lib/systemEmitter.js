import { EventEmitter } from 'events';
import { getIO } from '../socket/socket.js';
import { logAdminAction } from './adminLogger.js';

class SystemEmitter extends EventEmitter {
  constructor() {
    super();
    // Pre-bind emit to IO so we don't have to everywhere
    this.on('event', (data) => {
      try {
        const io = getIO();
        if (io) {
          // Broadcast to admin room
          io.to('admin_room').emit('system_event', {
            ...data,
            timestamp: new Date()
          });
        }
      } catch (error) {
        // IO might not be initialized yet
        console.warn('[SystemEmitter] IO not available for broadcasting event', data.type);
      }
    });
  }

  // Helper to standardise event emission
  broadcast(type, payload, severity = 'info') {
    this.emit('event', { type, payload, severity });
    
    // Simple insight rule evaluation trigger here (Phase 1)
    if (this.insightsEngine) {
      this.insightsEngine.evaluate(type, payload);
    }
  }
}

export const systemEmitter = new SystemEmitter();
