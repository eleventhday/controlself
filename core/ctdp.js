
export class CTDPEngine {
    constructor() {
        this.state = {
            chainCount: 0,
            auxChainCount: 0,
            status: 'idle', // idle, reserved, active
            startTime: null,
            reservationTime: null,
            duration: 60 * 60 * 1000, // 1 hour default
            reservationDuration: 15 * 60 * 1000, // 15 mins default
            exceptions: [],
        };
        this.load();
    }

    load() {
        const stored = localStorage.getItem('ctdp_state');
        if (stored) {
            this.state = JSON.parse(stored);
            // Restore dates
            if (this.state.startTime) this.state.startTime = new Date(this.state.startTime);
            if (this.state.reservationTime) this.state.reservationTime = new Date(this.state.reservationTime);
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
    startSession() {
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
        } else if (this.state.status === 'active') {
             throw new Error('Session already active');
        }

        // Start Main Session
        this.state.status = 'active';
        this.state.startTime = now;
        this.state.reservationTime = null;
        this.save();
        return this.state;
    }

    // Complete the session successfully
    completeSession() {
        if (this.state.status !== 'active') return;
        
        // Check if duration met? (Optional strict check)
        // For now, assume user claims completion.
        
        this.state.chainCount++;
        this.state.status = 'idle';
        this.state.startTime = null;
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
        this.save();
        return { ...this.state, reason };
    }

    exception(reason) {
        const entry = { time: new Date().toISOString(), reason };
        this.state.exceptions = this.state.exceptions || [];
        this.state.exceptions.push(entry);
        this.state.status = 'idle';
        this.state.startTime = null;
        this.state.reservationTime = null;
        this.save();
        return this.state;
    }

    getState() {
        return this.state;
    }

    reset() {
        this.fail('Manual Reset');
    }
}
