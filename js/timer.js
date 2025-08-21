export class TimerManager {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
        this.timeouts = new Map();
        
        // Industry standard times (in minutes)
        this.roundTimes = {
            dsa: 45,        // DSA: 45 minutes
            lld: 35,        // Low-Level Design: 35 minutes  
            hld: 45,        // High-Level Design: 45 minutes
            behavioral: 30  // Behavioral: 30 minutes
        };
    }

    startTimer(roundType) {
        const totalMinutes = this.roundTimes[roundType] || 45;
        const totalSeconds = totalMinutes * 60;
        
        this.timers.set(roundType, {
            total: totalSeconds,
            remaining: totalSeconds,
            isRunning: true
        });

        this.updateTimerDisplay(roundType);
        
        const interval = setInterval(() => {
            const timer = this.timers.get(roundType);
            if (!timer || !timer.isRunning) {
                clearInterval(interval);
                return;
            }

            timer.remaining--;
            this.updateTimerDisplay(roundType);

            if (timer.remaining <= 0) {
                this.handleTimeUp(roundType);
                clearInterval(interval);
            }
        }, 1000);

        this.intervals.set(roundType, interval);
    }

    stopTimer(roundType) {
        const timer = this.timers.get(roundType);
        if (timer) {
            timer.isRunning = false;
        }
        
        const interval = this.intervals.get(roundType);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(roundType);
        }
    }

    updateTimerDisplay(roundType) {
        const timer = this.timers.get(roundType);
        if (!timer) return;

        const minutes = Math.floor(timer.remaining / 60);
        const seconds = timer.remaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('round-timer');
        if (timerElement) {
            timerElement.textContent = timeString;
            
            // Color coding based on time remaining
            const percentage = timer.remaining / timer.total;
            if (percentage <= 0.1) {
                timerElement.className = 'timer critical';
            } else if (percentage <= 0.25) {
                timerElement.className = 'timer warning';
            } else {
                timerElement.className = 'timer normal';
            }
        }
    }

    handleTimeUp(roundType) {
        const event = new CustomEvent('timeUp', { detail: { roundType } });
        document.dispatchEvent(event);
    }

    getRemainingTime(roundType) {
        const timer = this.timers.get(roundType);
        return timer ? timer.remaining : 0;
    }

    isRunning(roundType) {
        const timer = this.timers.get(roundType);
        return timer ? timer.isRunning : false;
    }
}