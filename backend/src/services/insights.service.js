import { systemEmitter } from '../lib/systemEmitter.js';

class InsightsEngine {
  constructor() {
    this.events = [];
    this.insights = [];
    this.rules = [
      {
        id: 'high_login_failure',
        description: 'Unusual spike in failed login attempts',
        severity: 'critical',
        check: (events) => {
          const recentFailures = events.filter(e => 
            e.type === 'login_failed' && 
            (Date.now() - e.timestamp) < 5 * 60 * 1000 // last 5 mins
          );
          return recentFailures.length > 20; // 20 failures in 5 mins
        }
      },
      {
        id: 'high_message_volume',
        description: 'High message volume detected',
        severity: 'warning',
        check: (events) => {
          const recentMessages = events.filter(e => 
            e.type === 'message_sent' && 
            (Date.now() - e.timestamp) < 1 * 60 * 1000 // last 1 min
          );
          return recentMessages.length > 100; // 100 messages in 1 min
        }
      },
      {
        id: 'rapid_user_creation',
        description: 'Multiple users created in a short timeframe',
        severity: 'warning',
        check: (events) => {
          const recentSignups = events.filter(e => 
            e.type === 'user_signup' && 
            (Date.now() - e.timestamp) < 5 * 60 * 1000 // last 5 mins
          );
          return recentSignups.length > 10; // 10 signups in 5 mins
        }
      }
    ];

    // Bind engine to emitter
    systemEmitter.insightsEngine = this;
    
    // Periodically clean up old events (older than 15 mins)
    setInterval(() => {
      const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
      this.events = this.events.filter(e => e.timestamp > fifteenMinsAgo);
    }, 60 * 1000);
  }

  evaluate(type, payload) {
    // Record event
    this.events.push({ type, payload, timestamp: Date.now() });

    // Check rules
    for (const rule of this.rules) {
      if (rule.check(this.events)) {
        this.addInsight(rule);
      }
    }
  }

  addInsight(rule) {
    // Check if insight already exists and is active (last 5 mins)
    const existing = this.insights.find(i => i.id === rule.id);
    if (existing && (Date.now() - existing.timestamp) < 5 * 60 * 1000) {
      return; // Already alerted recently
    }

    const insight = {
      id: rule.id,
      description: rule.description,
      severity: rule.severity,
      timestamp: Date.now()
    };

    this.insights.unshift(insight);
    // Keep only last 50 insights
    if (this.insights.length > 50) this.insights.pop();

    // Broadcast insight
    systemEmitter.broadcast('system_insight', insight, rule.severity);
  }

  getInsights() {
    return this.insights;
  }
}

export const insightsEngine = new InsightsEngine();
