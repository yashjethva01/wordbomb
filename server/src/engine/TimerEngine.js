'use strict';

const { TIMER_TICK_INTERVAL_MS } = require('../config/constants');

class TimerEngine {
  constructor() {
    this._interval  = null;
    this._startedAt = null;
    this._duration  = null;
    this._expired   = false;
  }

  start(durationMs, onTick, onExpire) {
    this.stop();

    this._startedAt = Date.now();
    this._duration  = durationMs;
    this._expired   = false;

    this._interval = setInterval(() => {
      const elapsed   = Date.now() - this._startedAt;
      const remaining = this._duration - elapsed;

      if (remaining <= 0) {
        this.stop();
        if (!this._expired) {
          this._expired = true;
          try { onExpire(); } catch (err) {
            console.error('[TimerEngine] onExpire threw:', err);
          }
        }
        return;
      }

      const timeLeftSec = Math.ceil(remaining / 1000);
      try { onTick(timeLeftSec); } catch (err) {
        console.error('[TimerEngine] onTick threw:', err);
      }
    }, TIMER_TICK_INTERVAL_MS);
  }

  stop() {
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._startedAt = null;
    this._duration  = null;
  }

  getTimeLeft() {
    if (this._startedAt === null || this._duration === null) return 0;
    const remaining = this._duration - (Date.now() - this._startedAt);
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  isRunning() {
    return this._interval !== null;
  }
}

module.exports = TimerEngine;
