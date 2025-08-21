import { ROUNDS } from './config.js';
import { state } from './state.js';
import { CodeEditor } from './editor.js';
import { CodeExecutor } from './api.js';
import { DiagramEditor, DiagramAPI } from './diagram-integration.js';

export class UIManager {
    constructor() {
        this.initializeElements();
        this.codeEditor = null;
        this.currentLanguage = 'scala';
        this.testCases = [];
    }

    initializeElements() {
        this.roundItems = document.querySelectorAll('.round-item');
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.roundContent = document.getElementById('round-content');
        this.roundTitle = document.getElementById('round-title');
        this.problemArea = document.getElementById('problem-area');
        this.inputSection = document.getElementById('input-section');
        this.actionButtons = document.getElementById('action-buttons');
        this.feedbackDisplay = document.getElementById('feedback-display');
        this.textInput = document.getElementById('text-input');
        this.codeEditorContainer = document.getElementById('code-editor');
        this.voiceBtn = document.getElementById('voice-btn');
        this.textBtn = document.getElementById('text-btn');
        this.endRoundBtn = document.getElementById('end-round');
        this.overallFeedbackBtn = document.getElementById('overall-feedback');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.refreshProblemBtn = document.getElementById('refresh-problem');
        this.hintSection = document.getElementById('hint-section');
        this.hintInput = document.getElementById('hint-input');
        this.submitHintBtn = document.getElementById('submit-hint');
        this.cancelHintBtn = document.getElementById('cancel-hint');
        this.diagramContainer = document.getElementById('diagram-editor-container');
        this.saveDiagramBtn = document.getElementById('save-diagram');
        this.submitDiagramBtn = document.getElementById('submit-diagram');
        this.closeDiagramBtn = document.getElementById('close-diagram');
        this.diagramEditor = null;
    }

    async setupRound(roundType) {
        const config = ROUNDS[roundType];
        
        // Update UI visibility
        this.welcomeScreen.style.display = 'none';
        this.roundContent.style.display = 'block';
        this.roundTitle.textContent = config.title;
        
        // Setup code editor for DSA
        if (config.showCode) {
            await this.setupCodeEditor();
            this.textInput.style.display = 'none';
            this.diagramContainer.style.display = 'none';
        } else if (roundType === 'lld' || roundType === 'hld') {
            // Show diagram editor for design rounds
            this.codeEditorContainer.style.display = 'none';
            this.textInput.style.display = 'block';
            this.diagramContainer.style.display = 'none';
        } else {
            // Behavioral round
            this.codeEditorContainer.style.display = 'none';
            this.textInput.style.display = 'block';
            this.diagramContainer.style.display = 'none';
        }
        
        // Create action buttons
        this.createActionButtons(config.buttons);
        
        // Update round status
        this.updateRoundStatus(roundType);
        
        // Setup difficulty selector
        this.setupDifficultySelector();
        
        // Setup hint section
        this.setupHintSection();
        

    }

    async setupCodeEditor() {
        this.codeEditorContainer.style.display = 'block';
        
        if (!this.codeEditor) {
            // Add language selector
            this.addLanguageSelector();
            
            // Initialize Monaco Editor with test cases
            this.codeEditor = new CodeEditor('monaco-container');
            await this.codeEditor.initialize(this.testCases);
        }
    }

    addLanguageSelector() {
        const languageSelector = document.createElement('div');
        languageSelector.className = 'language-selector';
        languageSelector.innerHTML = `
            <label>Language: </label>
            <select id="language-select">
                <option value="scala" selected>Scala 3</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
            </select>
        `;
        
        this.codeEditorContainer.insertBefore(languageSelector, this.codeEditorContainer.firstChild);
        
        // Add test cases section
        this.addTestCasesSection();
        
        // Add Monaco container
        if (!document.getElementById('monaco-container')) {
            const monacoContainer = document.createElement('div');
            monacoContainer.id = 'monaco-container';
            monacoContainer.style.height = '300px';
            monacoContainer.style.border = '1px solid #ccc';
            this.codeEditorContainer.appendChild(monacoContainer);
        }

        // Language change handler
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            if (this.codeEditor) {
                this.codeEditor.setLanguage(this.currentLanguage);
            }
        });
    }

    addTestCasesSection() {
        const testSection = document.createElement('div');
        testSection.className = 'test-cases-section';
        testSection.innerHTML = `
            <div class="test-header">
                <h4>Test Cases</h4>
                <button id="run-tests" class="test-btn">Run Tests</button>
            </div>
            <div id="test-cases-container">
                <div class="loading-tests">Loading test cases...</div>
            </div>
        `;
        
        this.codeEditorContainer.appendChild(testSection);
        
        // Test runner handler
        document.getElementById('run-tests').addEventListener('click', () => {
            this.runTestCases();
        });
    }

    setTestCases(testCases) {
        this.testCases = testCases;
        const container = document.getElementById('test-cases-container');
        
        if (testCases.length === 0) {
            container.innerHTML = '<div class="no-tests">No test cases available</div>';
            return;
        }
        
        container.innerHTML = testCases.map((test, index) => `
            <div class="test-case">
                <div class="test-label">Test Case ${index + 1}:</div>
                <div class="test-input"><strong>Input:</strong> ${test.input}</div>
                <div class="test-output"><strong>Expected:</strong> ${test.output}</div>
                <div class="test-result" id="result-${index}"></div>
            </div>
        `).join('');
        
        // Update code editor with new test cases
        if (this.codeEditor) {
            this.codeEditor.setTestCases(testCases);
        }
    }

    async runTestCases() {
        if (!this.codeEditor || this.testCases.length === 0) {
            this.setFeedback('No test cases available or code editor not ready.');
            return;
        }
        
        const code = this.codeEditor.getValue();
        if (!code.trim()) {
            this.setFeedback('Please write some code first.');
            return;
        }
        
        this.setFeedback('Running all test cases...');
        
        // Execute all test cases in single API call
        const result = await CodeExecutor.executeWithTestCases(code, this.currentLanguage, this.testCases);
        
        if (result.error) {
            this.setFeedback(`Error: ${result.error}`);
            return;
        }
        
        // Update UI with results
        let passedTests = 0;
        result.testResults.forEach((testResult, index) => {
            const resultDiv = document.getElementById(`result-${index}`);
            
            if (testResult.passed) {
                resultDiv.innerHTML = `<span class="test-pass">✅ Passed</span>`;
                passedTests++;
            } else {
                resultDiv.innerHTML = `<span class="test-fail">❌ Got: ${testResult.actual}</span>`;
            }
        });
        
        this.setFeedback(`Test Results: ${passedTests}/${this.testCases.length} tests passed | Memory: ${result.memory}KB | Time: ${result.cpuTime}s`);
    }
    


    createActionButtons(buttons) {
        this.actionButtons.innerHTML = '';
        buttons.forEach(btnText => {
            const btn = document.createElement('button');
            btn.textContent = btnText;
            btn.className = 'action-btn primary-btn';
            btn.onclick = () => this.handleActionClick(btnText);
            this.actionButtons.appendChild(btn);
        });
    }

    async handleActionClick(action) {
        if (action === 'Run Code' && this.codeEditor) {
            await this.executeCode();
        } else if (action === 'Ask for Hint') {
            // Show inline hint section
            this.showHintSection();
        } else if (action === 'Open Diagram Editor') {
            // Show diagram editor
            this.diagramContainer.style.display = 'block';
            if (!this.diagramEditor) {
                this.setupDiagramEditor(state.currentRound);
            }
        } else {
            // Dispatch to round manager
            const event = new CustomEvent('actionClicked', { detail: { action } });
            document.dispatchEvent(event);
        }
    }

    async executeCode() {
        const code = this.codeEditor.getValue();
        if (!code.trim()) {
            this.setFeedback('Please write some code first.');
            return;
        }

        this.setFeedback('Executing code...');
        
        const result = await CodeExecutor.execute(code, this.currentLanguage);
        
        // Show output area
        const outputSection = document.getElementById('code-output');
        const outputArea = document.getElementById('output-area');
        
        outputSection.style.display = 'block';
        
        if (result.error) {
            outputArea.value = `Error: ${result.error}`;
            outputArea.style.color = 'red';
        } else {
            outputArea.value = `Output:\n${result.output}\n\nMemory: ${result.memory} KB | CPU Time: ${result.cpuTime}s`;
            outputArea.style.color = 'black';
        }
        
        this.setFeedback('Code executed successfully!');
    }

    updateRoundStatus(roundType) {
        this.roundItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-round="${roundType}"]`).classList.add('active');
    }

    setProblemArea(content) {
        this.problemArea.innerHTML = content;
    }

    setFeedback(content) {
        this.feedbackDisplay.innerHTML = content;
    }

    getUserInput() {
        if (state.currentRound === 'dsa' && this.codeEditor) {
            return this.codeEditor.getValue();
        }
        return this.textInput.value;
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'block';
        this.roundContent.style.display = 'none';
    }

    showOverallFeedback() {
        if (state.isAllRoundsCompleted()) {
            this.overallFeedbackBtn.style.display = 'block';
        }
    }

    markRoundCompleted(roundType) {
        document.querySelector(`[data-round="${roundType}"]`).classList.add('completed');
    }



    setupDifficultySelector() {
        // Refresh problem button handler
        this.refreshProblemBtn.addEventListener('click', () => {
            const event = new CustomEvent('refreshProblem', { 
                detail: { difficulty: this.difficultySelect.value } 
            });
            document.dispatchEvent(event);
        });
    }

    getCurrentDifficulty() {
        return this.difficultySelect ? this.difficultySelect.value : 'easy';
    }

    showHintSection() {
        this.hintSection.style.display = 'block';
        this.hintInput.focus();
    }

    hideHintSection() {
        this.hintSection.style.display = 'none';
        this.hintInput.value = '';
    }

    setupHintSection() {
        // FAQ button handlers
        document.querySelectorAll('.faq-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.requestHint(question);
            });
        });

        // Submit hint button
        this.submitHintBtn.addEventListener('click', () => {
            const question = this.hintInput.value.trim();
            if (question) {
                this.requestHint(question);
            } else {
                this.hintInput.focus();
            }
        });

        // Cancel hint button
        this.cancelHintBtn.addEventListener('click', () => {
            this.hideHintSection();
        });

        // Enter key to submit
        this.hintInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                const question = this.hintInput.value.trim();
                if (question) {
                    this.requestHint(question);
                }
            }
        });
    }

    requestHint(question) {
        this.hideHintSection();
        const event = new CustomEvent('hintRequested', { detail: { question } });
        document.dispatchEvent(event);
    }

    async setupDiagramEditor(roundType) {
        if (this.diagramEditor?.initialized) return;
        
        this.diagramEditor = new DiagramEditor('diagram-iframe-container');
        
        const existingXML = await DiagramAPI.loadDiagram(roundType);
        
        this.diagramEditor.onSave(async (xml) => {
            await DiagramAPI.saveDiagram(roundType, xml);
            this.setFeedback('Diagram saved successfully!');
        });
        
        this.saveDiagramBtn.onclick = () => {
            this.diagramEditor.save();
        };
        
        this.submitDiagramBtn.onclick = () => {
            this.submitDiagram();
        };
        
        this.closeDiagramBtn.onclick = () => {
            this.diagramContainer.style.display = 'none';
        };
        
        this.diagramEditor.embed(existingXML);
    }

    getDiagramXML() {
        return this.diagramEditor ? this.diagramEditor.getCurrentXML() : '';
    }

    async submitDiagram() {
        const diagramXML = this.getDiagramXML();
        if (!diagramXML) {
            this.setFeedback('Please create a diagram first.');
            return;
        }
        
        this.setFeedback('Evaluating diagram...');
        const event = new CustomEvent('diagramSubmitted', { 
            detail: { diagramXML, roundType: state.currentRound } 
        });
        document.dispatchEvent(event);
    }
}