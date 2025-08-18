// Application State Management
export class InterviewState {
    constructor() {
        this.currentRound = null;
        this.completedRounds = [];
        this.roundProblems = {}; // Preserve problems across rounds
        this.roundData = {};
        this.isListening = false;
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('interviewState');
            if (saved) {
                const data = JSON.parse(saved);
                this.roundProblems = data.roundProblems || {};
                this.completedRounds = data.completedRounds || [];
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }

    saveToStorage() {
        try {
            const data = {
                roundProblems: this.roundProblems,
                completedRounds: this.completedRounds
            };
            localStorage.setItem('interviewState', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    setCurrentRound(round) {
        this.currentRound = round;
    }

    completeRound(round) {
        if (!this.completedRounds.includes(round)) {
            this.completedRounds.push(round);
            this.saveToStorage();
        }
    }

    setProblem(round, problem) {
        this.roundProblems[round] = problem;
        this.saveToStorage();
    }

    getProblem(round) {
        return this.roundProblems[round];
    }

    hasProblem(round) {
        return !!this.roundProblems[round];
    }

    isAllRoundsCompleted() {
        return this.completedRounds.length === 4;
    }

    reset() {
        this.currentRound = null;
        this.completedRounds = [];
        this.roundProblems = {};
        this.roundData = {};
        localStorage.removeItem('interviewState');
    }

    clearRoundProblem(round) {
        delete this.roundProblems[round];
        this.saveToStorage();
    }
}

export const state = new InterviewState();