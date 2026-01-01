
export class CTDPEngine {
    constructor() {
        this.state = {
            chainCount: 0,
            auxChainCount: 0, // In UI this will be "Reservation Chain"
            status: 'idle', // idle, reserved, active, paused
            startTime: null,
            reservationTime: null,
            duration: 60 * 60 * 1000, // 1 hour default
            reservationDuration: 15 * 60 * 1000, // 15 mins default
            exceptions: [], // Log of all exceptions ever? Or current session? Previous code implied global log.
            // New fields
            pauseStartTime: null,
            totalPausedTime: 0,
            currentTask: null, // { name, content, duration }
            history: [], // { startTime, endTime, duration, notes, taskName }
            savedReasons: ['手机消息', '同事打扰', '喝水/上厕所', '突发会议'], // Preset reasons
            sessionExceptions: [] // Exceptions in current session
        };
        this.load();
    }

    load() {
        const stored = localStorage.getItem('ctdp_state');
        if (stored) {
            const loaded = JSON.parse(stored);
            this.state = { ...this.state, ...loaded };
            // Restore dates
            if (this.state.startTime) this.state.startTime = new Date(this.state.startTime);
            if (this.state.reservationTime) this.state.reservationTime = new Date(this.state.reservationTime);
            if (this.state.pauseStartTime) this.state.pauseStartTime = new Date(this.state.pauseStartTime);
            // Ensure arrays exist
            if (!this.state.history) this.state.history = [];
            if (!this.state.savedReasons) this.state.savedReasons = ['手机消息', '同事打扰', '喝水/上厕所', '突发会议'];
            if (!this.state.sessionExceptions) this.state.sessionExceptions = [];
        }
    }

    save() {
        localStorage.setItem('ctdp_state', JSON.stringify(this.state));
    }

    // Linear Time Delay: Reserve a session
    reserve() {
        if (this.state.status !== 'idle') {
            throw new Error('Cannot reserve: System is not idle');
        }
        this.state.status = 'reserved';
        this.state.reservationTime = new Date();
        this.save();
        return this.state;
    }

    // Sacred Seat: Start the actual session
    startSession(task = null) {
        const now = new Date();
        
        // If reserved, check if within 15 mins
        if (this.state.status === 'reserved') {
            const diff = now - new Date(this.state.reservationTime);
            if (diff > this.state.reservationDuration) {
                this.fail('Reservation expired');
                throw new Error('Reservation expired');
            }
            // Success on reservation -> Increment Aux Chain
            this.state.auxChainCount++;
        } else if (this.state.status === 'active' || this.state.status === 'paused') {
             throw new Error('Session already active');
        }

        // Start Main Session
        this.state.status = 'active';
        this.state.startTime = now;
        this.state.reservationTime = null;
        this.state.pauseStartTime = null;
        this.state.totalPausedTime = 0;
        this.state.sessionExceptions = [];
        this.state.currentTask = task;
        
        this.save();
        return this.state;
    }

    // Pause the session (Exception triggered)
    pause(reason) {
        if (this.state.status !== 'active') return;
        
        const now = new Date();
        this.state.status = 'paused';
        this.state.pauseStartTime = now;
        
        // Log exception
        const entry = { time: now.toISOString(), reason };
        this.state.exceptions.push(entry);
        this.state.sessionExceptions.push(entry);
        
        // Add to saved reasons if new and valid
        if (reason && !this.state.savedReasons.includes(reason)) {
            this.state.savedReasons.push(reason);
        }

        this.save();
        return this.state;
    }

    // Resume the session
    resume() {
        if (this.state.status !== 'paused') return;
        
        const now = new Date();
        if (this.state.pauseStartTime) {
            const pauseDuration = now - new Date(this.state.pauseStartTime);
            this.state.totalPausedTime = (this.state.totalPausedTime || 0) + pauseDuration;
        }
        
        this.state.status = 'active';
        this.state.pauseStartTime = null;
        this.save();
        return this.state;
    }

    // Complete the session successfully
    completeSession(notes = '') {
        if (this.state.status !== 'active' && this.state.status !== 'paused') return;
        
        const now = new Date();
        // If completed while paused, calculate final pause duration
        if (this.state.status === 'paused' && this.state.pauseStartTime) {
             const pauseDuration = now - new Date(this.state.pauseStartTime);
             this.state.totalPausedTime = (this.state.totalPausedTime || 0) + pauseDuration;
        }

        const duration = now - new Date(this.state.startTime) - (this.state.totalPausedTime || 0);
        
        const historyEntry = {
            id: Date.now().toString(),
            startTime: this.state.startTime.toISOString(),
            endTime: now.toISOString(),
            duration: duration,
            notes: notes,
            task: this.state.currentTask,
            exceptions: [...this.state.sessionExceptions]
        };

        this.state.history.unshift(historyEntry); // Add to beginning
        this.state.chainCount++;
        
        // Reset
        this.state.status = 'idle';
        this.state.startTime = null;
        this.state.reservationTime = null;
        this.state.pauseStartTime = null;
        this.state.totalPausedTime = 0;
        this.state.sessionExceptions = [];
        this.state.currentTask = null;
        
        this.save();
        return this.state;
    }

    // Next Time Must: Fail logic
    fail(reason = 'unknown') {
        // Reset Chains
        this.state.chainCount = 0;
        this.state.auxChainCount = 0;
        this.state.status = 'idle';
        this.state.startTime = null;
        this.state.reservationTime = null;
        this.state.pauseStartTime = null;
        this.state.totalPausedTime = 0;
        this.state.sessionExceptions = [];
        this.state.currentTask = null;
        
        this.save();
        return { ...this.state, reason };
    }

    // Manage Reasons
    addReason(reason) {
        if (reason && !this.state.savedReasons.includes(reason)) {
            this.state.savedReasons.push(reason);
            this.save();
        }
    }

    removeReason(reason) {
        this.state.savedReasons = this.state.savedReasons.filter(r => r !== reason);
        this.save();
    }

    updateHistoryNote(id, note) {
        const entry = this.state.history.find(h => h.id === id);
        if (entry) {
            entry.notes = note;
            this.save();
        }
    }

    getState() {
        return this.state;
    }

    reset() {
        this.fail('Manual Reset');
    }
}
