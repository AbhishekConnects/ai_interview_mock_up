import { UIManager } from './ui.js';
import { RoundManager } from './rounds.js';
import { SpeechManager } from './speech.js';
import { TimerManager } from './timer.js';
import { state } from './state.js';

class InterviewApp {
    constructor() {
        this.ui = new UIManager();
        this.roundManager = new RoundManager(this.ui);
        this.speechManager = new SpeechManager();
        this.timerManager = new TimerManager();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Round selection
        this.ui.roundItems.forEach(item => {
            item.addEventListener('click', () => this.startRound(item.dataset.round));
        });

        // Voice/Text toggle
        this.ui.voiceBtn.addEventListener('click', () => this.toggleVoiceMode());
        this.ui.textBtn.addEventListener('click', () => this.toggleTextMode());

        // Round controls
        this.ui.endRoundBtn.addEventListener('click', () => this.endCurrentRound());
        this.ui.overallFeedbackBtn.addEventListener('click', () => this.showOverallFeedback());

        // Action button handler
        document.addEventListener('actionClicked', (e) => {
            this.handleAction(e.detail.action);
        });

        // Refresh problem handler
        document.addEventListener('refreshProblem', (e) => {
            this.refreshProblem(e.detail.difficulty);
        });

        // Hint request handler
        document.addEventListener('hintRequested', (e) => {
            this.handleHintRequest(e.detail.question);
        });

        // Diagram submission handler
        document.addEventListener('diagramSubmitted', (e) => {
            this.handleDiagramSubmission(e.detail.diagramXML, e.detail.roundType);
        });

        // Timer event handler
        document.addEventListener('timeUp', (e) => {
            this.handleTimeUp(e.detail.roundType);
        });

        // Speech recognition callbacks
        this.speechManager.onTranscript = (transcript) => {
            this.ui.textInput.value = transcript;
            this.ui.setFeedback('Processing your response...');
            this.handleAction('Submit Answer');
        };

        this.speechManager.onEnd = () => {
            // Speech ended
        };

        this.speechManager.onError = (error) => {
            this.ui.setFeedback(`Speech error: ${error}`);
        };
    }

    async startRound(roundType) {
        // Check if there's an active round that needs to be handled first
        if (state.currentRound && state.currentRound !== roundType) {
            const confirmed = confirm(`You have an active ${state.currentRound.toUpperCase()} round. You must submit your solution or end the round before switching. Do you want to end the current round?`);
            if (!confirmed) {
                return; // Don't switch rounds
            }
            this.endCurrentRound();
        }
        
        state.setCurrentRound(roundType);
        
        // Setup UI for the round
        await this.ui.setupRound(roundType);
        
        // Initialize round content first
        await this.roundManager.initializeRound(roundType);
        
        // Start timer after everything is set up
        this.timerManager.startTimer(roundType);
    }

    toggleVoiceMode() {
        this.ui.voiceBtn.classList.add('active');
        this.ui.textBtn.classList.remove('active');
        
        if (this.speechManager.isSupported()) {
            if (this.speechManager.startListening()) {
                this.ui.setFeedback('Listening... speak your response.');
            } else {
                this.ui.setFeedback('Speech recognition not available.');
            }
        } else {
            this.ui.setFeedback('Speech recognition not supported in this browser.');
        }
    }

    toggleTextMode() {
        this.ui.textBtn.classList.add('active');
        this.ui.voiceBtn.classList.remove('active');
        this.speechManager.stopListening();
    }

    async handleHintRequest(question) {
        this.ui.setFeedback('Getting hint from interviewer...');
        
        try {
            const response = await this.roundManager.handleAction('Ask for Hint', '', question);
            this.ui.setFeedback(`<div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;"><strong>💡 Interviewer Hint:</strong><br><br><div style="font-style: italic; color: #2c3e50;">${response.replace(/\n/g, '<br>')}</div></div>`);
        } catch (error) {
            this.ui.setFeedback(`Error getting hint: ${error.message}`);
        }
    }

    async handleAction(action) {

        const userInput = this.ui.getUserInput();
        
        if (!userInput.trim() && action !== 'Ask for Clarification' && action !== 'Clarify Requirement') {
            this.ui.setFeedback('Please provide your input first.');
            return;
        }

        this.ui.setFeedback('Processing...');
        
        try {
            const response = await this.roundManager.handleAction(action, userInput);
            this.ui.setFeedback(response.replace(/\n/g, '<br>'));
        } catch (error) {
            this.ui.setFeedback(`Error: ${error.message}`);
        }
    }

    endCurrentRound() {
        if (state.currentRound) {
            this.timerManager.stopTimer(state.currentRound);
            state.completeRound(state.currentRound);
            this.ui.markRoundCompleted(state.currentRound);
            const completedRound = state.currentRound;
            state.setCurrentRound(null);
            
            this.ui.setFeedback(`${completedRound.toUpperCase()} round completed successfully!`);
        }
        
        this.ui.showWelcomeScreen();
        this.ui.showOverallFeedback();
    }

    async showOverallFeedback() {
        this.ui.setFeedback('Generating overall feedback...');
        
        try {
            const feedback = await this.roundManager.generateOverallFeedback();
            
            this.ui.setProblemArea('<h3>Overall Interview Feedback</h3>');
            this.ui.setFeedback(feedback.replace(/\n/g, '<br>'));
            
            this.ui.welcomeScreen.style.display = 'none';
            this.ui.roundContent.style.display = 'block';
            this.ui.roundTitle.textContent = 'Interview Complete';
            this.ui.inputSection.style.display = 'none';
            this.ui.actionButtons.style.display = 'none';
        } catch (error) {
            this.ui.setFeedback(`Error generating feedback: ${error.message}`);
        }
    }

    async refreshProblem(difficulty) {
        if (!state.currentRound) {
            this.ui.setFeedback('Please select a round first.');
            return;
        }

        this.ui.setFeedback('Fetching fresh problem...');
        
        try {
            // Stop current timer and restart with fresh problem
            this.timerManager.stopTimer(state.currentRound);
            await this.roundManager.refreshProblem(state.currentRound, difficulty);
            this.timerManager.startTimer(state.currentRound);
            this.ui.setFeedback('Fresh problem loaded successfully!');
        } catch (error) {
            this.ui.setFeedback(`Error fetching problem: ${error.message}`);
        }
    }

    async handleDiagramSubmission(diagramXML, roundType) {
        this.ui.setFeedback('Evaluating your diagram...');
        
        try {
            const evaluation = await this.roundManager.evaluateDiagram(diagramXML, roundType);
            this.ui.setFeedback(`<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;"><strong>📊 Diagram Evaluation:</strong><br><br>${evaluation.replace(/\n/g, '<br>')}</div>`);
        } catch (error) {
            this.ui.setFeedback(`Error evaluating diagram: ${error.message}`);
        }
    }

    handleTimeUp(roundType) {
        this.ui.setFeedback(`<div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;"><strong>⏰ Time's Up!</strong><br><br>The ${roundType.toUpperCase()} round has ended. Please submit your final answer or move to the next round.</div>`);
        
        // Auto-end round after 30 seconds grace period
        setTimeout(() => {
            if (state.currentRound === roundType) {
                this.endCurrentRound();
            }
        }, 30000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InterviewApp();
});