import { GeminiAPI } from './api.js';
import { LeetCodeAPI } from './leetcode-api.js';
import { ROUNDS } from './config.js';
import { state } from './state.js';

export class RoundManager {
    constructor(ui) {
        this.ui = ui;
    }

    async initializeRound(roundType) {
        const config = ROUNDS[roundType];
        
        // Show welcome message first
        this.ui.setProblemArea(`<p>${config.welcome}</p>`);
        
        // Check if problem already exists for this round
        if (state.hasProblem(roundType)) {
            const existingProblem = state.getProblem(roundType);
            const difficulty = this.ui.getCurrentDifficulty();
            this.ui.setProblemArea(`<div><strong>Problem (${difficulty.toUpperCase()}) - Cached:</strong></div><div>${existingProblem.replace(/\n/g, '<br>')}</div>`);
            
            // Also set test cases for existing DSA problems
            if (roundType === 'dsa') {
                const problemData = state.getProblemData(roundType);
                const testCases = problemData ? LeetCodeAPI.extractTestCases(problemData) : this.extractTestCases(existingProblem);
                this.ui.setTestCases(testCases);
            }
            return;
        }

        // Generate new problem
        const difficulty = this.ui.getCurrentDifficulty();
        
        if (roundType === 'dsa') {
            // Use LeetCode API for DSA problems
            const problemData = await LeetCodeAPI.getRandomProblem(difficulty);
            const problem = LeetCodeAPI.formatProblemForDisplay(problemData);
            
            // Store both formatted problem and raw data
            state.setProblem(roundType, problem);
            state.setProblemData(roundType, problemData);
            
            // Extract and set test cases
            const testCases = LeetCodeAPI.extractTestCases(problemData);
            this.ui.setTestCases(testCases);
            
            this.ui.setProblemArea(`<div><strong>LeetCode Problem (${difficulty.toUpperCase()}):</strong></div><div>${problem.replace(/\n/g, '<br>')}</div>`);
        } else {
            // Use Gemini for other rounds
            const prompt = this.getPromptForRound(roundType, difficulty);
            const problem = await GeminiAPI.call(prompt);
            
            state.setProblem(roundType, problem);
            this.ui.setProblemArea(`<div><strong>Problem (${difficulty.toUpperCase()}):</strong></div><div>${problem.replace(/\n/g, '<br>')}</div>`);
        }
    }

    getPromptForRound(roundType, difficulty = 'easy') {
        const prompts = {
            dsa: `Generate a ${difficulty}-difficulty coding problem suitable for a technical interview. Include problem statement, constraints, and example. IMPORTANT: Also provide exactly 3 test cases in this format:\n\nTest Cases:\n1. Input: [input] Output: [output]\n2. Input: [input] Output: [output]\n3. Input: [input] Output: [output]`,
            lld: `Give a ${difficulty}-complexity low-level design problem. For easy: simple components like "Design a Logger". For medium: "Design a Cache System". For hard: "Design a Distributed Lock Manager". Be specific about requirements.`,
            hld: `Give a ${difficulty}-scale system design problem. For easy: "Design a URL Shortener for 1K users". For medium: "Design a Chat System for 1M users". For hard: "Design a Global CDN for 1B users". Include appropriate scale requirements.`,
            behavioral: `Ask a ${difficulty === 'easy' ? 'straightforward' : difficulty === 'hard' ? 'complex leadership' : 'standard'} behavioral interview question using the STAR method format. Focus on ${difficulty === 'easy' ? 'basic teamwork' : difficulty === 'hard' ? 'senior leadership and conflict resolution' : 'problem-solving and collaboration'} scenarios.`
        };
        return prompts[roundType] || prompts.dsa;
    }

    extractTestCases(problemText) {
        const testCases = [];
        const lines = problemText.split('\n');
        let inTestSection = false;
        
        for (const line of lines) {
            if (line.includes('Test Cases:') || line.includes('Test Case')) {
                inTestSection = true;
                continue;
            }
            
            if (inTestSection && line.includes('Input:') && line.includes('Output:')) {
                const inputMatch = line.match(/Input:\s*(.+?)\s*Output:/i);
                const outputMatch = line.match(/Output:\s*(.+?)$/i);
                
                if (inputMatch && outputMatch) {
                    testCases.push({
                        input: inputMatch[1].trim(),
                        output: outputMatch[1].trim()
                    });
                }
            }
        }
        
        // Fallback: create default test cases if none found
        if (testCases.length === 0) {
            testCases.push(
                { input: '5', output: '5' },
                { input: '10', output: '10' },
                { input: '1', output: '1' }
            );
        }
        
        return testCases;
    }

    async handleAction(action, userInput, hintQuestion = null) {
        const prompts = {
            'Explain Approach': `User's approach explanation: "${userInput}". Provide feedback on their thought process and ask follow-up questions.`,
            'Run Code': `Evaluate this code solution: "${userInput}". Check correctness, efficiency, and provide detailed feedback with time/space complexity analysis.`,
            'Ask for Hint': hintQuestion ? 
                `You are an experienced technical interviewer conducting a ${state.currentRound?.toUpperCase()} interview. The candidate is working on this problem:

"${state.getProblem(state.currentRound) || 'Current interview problem'}"

The candidate is stuck and asks: "${hintQuestion}"

As a supportive interviewer, provide a helpful hint that:
- Acknowledges their question professionally
- Guides them toward the right direction without giving away the solution
- Uses encouraging language like "Think about...", "Consider...", "What if you..."
- Maintains the interview atmosphere
- Helps them discover the solution themselves

Respond as if you're speaking directly to the candidate in an interview setting.` :
                'As an interviewer, provide a helpful hint for the current problem without giving away the complete solution.',
            'Propose Design': `Review this LLD proposal: "${userInput}". Evaluate class design, OOP principles, and API contracts. Provide constructive feedback.`,
            'Clarify Requirement': 'The user needs clarification on the LLD requirements. Provide more specific details about the system requirements.',
            'Propose Architecture': `Review this HLD architecture: "${userInput}". Evaluate scalability, technology choices, and system design. Provide detailed feedback.`,
            'Ask for Clarification': 'The user needs clarification on the HLD requirements. Provide more details about scale, constraints, and non-functional requirements.',
            'Submit Answer': `Evaluate this behavioral response: "${userInput}". Check if it follows STAR method and provide constructive feedback on communication and content.`
        };

        const prompt = prompts[action] || prompts['Submit Answer'];
        return await GeminiAPI.call(prompt);
    }

    async evaluateDiagram(diagramXML, roundType) {
        const problemStatement = state.getProblem(roundType) || 'Design problem';
        return await GeminiAPI.evaluateDiagram(diagramXML, roundType, problemStatement);
    }



    async generateOverallFeedback() {
        const prompt = `Provide comprehensive interview feedback for someone who completed all 4 rounds: DSA, LLD, HLD, and Behavioral. Give overall assessment, strengths, areas for improvement, and recommendations.`;
        return await GeminiAPI.call(prompt);
    }

    async refreshProblem(roundType, difficulty) {
        // Clear existing problem to force new generation
        state.clearRoundProblem(roundType);
        
        if (roundType === 'dsa') {
            // Use LeetCode API for DSA problems
            const problemData = await LeetCodeAPI.getRandomProblem(difficulty);
            const problem = LeetCodeAPI.formatProblemForDisplay(problemData);
            
            // Store both formatted problem and raw data
            state.setProblem(roundType, problem);
            state.setProblemData(roundType, problemData);
            
            // Extract and set test cases
            const testCases = LeetCodeAPI.extractTestCases(problemData);
            this.ui.setTestCases(testCases);
            
            this.ui.setProblemArea(`<div><strong>LeetCode Problem (${difficulty.toUpperCase()}) - Fresh:</strong></div><div>${problem.replace(/\n/g, '<br>')}</div>`);
        } else {
            // Use Gemini for other rounds
            const prompt = this.getPromptForRound(roundType, difficulty);
            const problem = await GeminiAPI.call(prompt);
            
            state.setProblem(roundType, problem);
            this.ui.setProblemArea(`<div><strong>Problem (${difficulty.toUpperCase()}) - Fresh:</strong></div><div>${problem.replace(/\n/g, '<br>')}</div>`);
        }
        
        return state.getProblem(roundType);
    }
}