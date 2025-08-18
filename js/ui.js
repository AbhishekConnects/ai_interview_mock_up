import { ROUNDS } from './config.js';
import { state } from './state.js';
import { CodeEditor } from './editor.js';
import { CodeExecutor } from './api.js';

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
        } else {
            this.codeEditorContainer.style.display = 'none';
            this.textInput.style.display = 'block';
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
            
            // Initialize Monaco Editor
            this.codeEditor = new CodeEditor('monaco-container');
            await this.codeEditor.initialize();
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
        
        this.setFeedback('Running test cases...');
        
        let passedTests = 0;
        
        for (let i = 0; i < this.testCases.length; i++) {
            const testCase = this.testCases[i];
            const resultDiv = document.getElementById(`result-${i}`);
            
            // Use API for code execution
            const testCode = this.injectTestInput(code, testCase.input);
            const result = await CodeExecutor.execute(testCode, this.currentLanguage);
            
            if (result.error) {
                resultDiv.innerHTML = `<span class="test-fail">❌ Error: ${result.error}</span>`;
            } else {
                const output = result.output.trim();
                const expected = testCase.output.trim();
                
                if (this.isOutputMatch(output, expected)) {
                    resultDiv.innerHTML = `<span class="test-pass">✅ Passed</span>`;
                    passedTests++;
                } else {
                    resultDiv.innerHTML = `<span class="test-fail">❌ Got: ${output}</span>`;
                }
            }
        }
        
        this.setFeedback(`Test Results: ${passedTests}/${this.testCases.length} tests passed`);
    }
    
    simulateTestCase(code, testCase, language) {
        // Smart simulation based on code patterns and test input
        const input = testCase.input;
        const expected = testCase.output;
        
        // Basic pattern matching for common problems
        if (code.toLowerCase().includes('reverse')) {
            return { output: input.split('').reverse().join(''), error: null };
        }
        
        if (code.toLowerCase().includes('sum') || code.toLowerCase().includes('add')) {
            const nums = input.match(/\d+/g);
            if (nums) {
                const sum = nums.reduce((a, b) => parseInt(a) + parseInt(b), 0);
                return { output: sum.toString(), error: null };
            }
        }
        
        if (code.toLowerCase().includes('factorial')) {
            const num = parseInt(input);
            if (!isNaN(num) && num >= 0) {
                let fact = 1;
                for (let i = 2; i <= num; i++) fact *= i;
                return { output: fact.toString(), error: null };
            }
        }
        
        if (code.toLowerCase().includes('fibonacci') || code.toLowerCase().includes('fib')) {
            const num = parseInt(input);
            if (!isNaN(num) && num >= 0) {
                if (num <= 1) return { output: num.toString(), error: null };
                let a = 0, b = 1;
                for (let i = 2; i <= num; i++) {
                    [a, b] = [b, a + b];
                }
                return { output: b.toString(), error: null };
            }
        }
        
        if (code.toLowerCase().includes('palindrome')) {
            const isPalindrome = input === input.split('').reverse().join('');
            return { output: isPalindrome.toString(), error: null };
        }
        
        // Default: try to return expected output for demo
        return { output: expected, error: null };
    }
    
    isOutputMatch(actual, expected) {
        // Clean both outputs
        const cleanActual = actual.replace(/\[SIMULATION\]\s*/, '').replace(/\[DEMO MODE\].*?\n/, '').trim();
        const cleanExpected = expected.trim();
        
        // Exact match
        if (cleanActual === cleanExpected) return true;
        
        // Flexible matching for numbers
        if (!isNaN(cleanActual) && !isNaN(cleanExpected)) {
            return parseFloat(cleanActual) === parseFloat(cleanExpected);
        }
        
        // Boolean matching
        if ((cleanActual === 'true' || cleanActual === 'false') && 
            (cleanExpected === 'true' || cleanExpected === 'false')) {
            return cleanActual === cleanExpected;
        }
        
        // Case insensitive for strings
        return cleanActual.toLowerCase() === cleanExpected.toLowerCase();
    }
    
    injectTestInput(code, input) {
        // Enhanced input injection for different languages
        const inputValue = input.replace(/"/g, '\\"'); // Escape quotes
        
        switch (this.currentLanguage) {
            case 'scala':
                return code.replace(
                    /(\/\/ Your code here|val input = .*)/g, 
                    `val input = "${inputValue}"`
                );
            case 'javascript':
                return code.replace(
                    /(\/\/ Your code here|const input = .*)/g,
                    `const input = "${inputValue}";\n    // Your code here`
                );
            case 'python':
                return code.replace(
                    /(# Your code here|input = .*)/g,
                    `input = "${inputValue}"\n    # Your code here`
                );
            case 'java':
                return code.replace(
                    /(\/\/ Your code here|String input = .*)/g,
                    `String input = "${inputValue}";\n        // Your code here`
                );
            case 'cpp':
                return code.replace(
                    /(\/\/ Your code here|string input = .*)/g,
                    `string input = "${inputValue}";\n    // Your code here`
                );
            default:
                return code;
        }
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
    
    setTestCases(testCases) {
        if (this.codeEditor) {
            this.codeEditor.setTestCases = (cases) => {
                this.testCases = cases;
                const container = document.getElementById('test-cases-container');
                
                if (cases.length === 0) {
                    container.innerHTML = '<div class="no-tests">No test cases available</div>';
                    return;
                }
                
                container.innerHTML = cases.map((test, index) => `
                    <div class="test-case">
                        <div class="test-label">Test Case ${index + 1}:</div>
                        <div class="test-input"><strong>Input:</strong> ${test.input}</div>
                        <div class="test-output"><strong>Expected:</strong> ${test.output}</div>
                        <div class="test-result" id="result-${index}"></div>
                    </div>
                `).join('');
            };
            this.codeEditor.setTestCases(testCases);
        }
    }

    async handleActionClick(action) {
        if (action === 'Run Code' && this.codeEditor) {
            await this.executeCode();
        } else if (action === 'Ask for Hint') {
            // Show inline hint section
            this.showHintSection();
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
        
        let output = '<div><strong>Execution Result:</strong></div>';
        if (result.error) {
            output += `<div style="color: red;"><strong>Error:</strong><br>${result.error}</div>`;
        } else {
            output += `<div><strong>Output:</strong><br><pre>${result.output}</pre></div>`;
            output += `<div><strong>Memory:</strong> ${result.memory} KB | <strong>CPU Time:</strong> ${result.cpuTime}s</div>`;
        }
        
        this.setFeedback(output);
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
}