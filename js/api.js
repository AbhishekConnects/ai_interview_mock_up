import { CONFIG } from './config.js';

// Gemini API Service
export class GeminiAPI {
    static async call(prompt) {
        try {
            const response = await fetch(CONFIG.GEMINI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': CONFIG.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
        } catch (error) {
            return `Error: ${error.message}`;
        }
    }

    static async evaluateDiagram(diagramXML, roundType, problemStatement) {
        const prompt = this.getDiagramEvaluationPrompt(diagramXML, roundType, problemStatement);
        return await this.call(prompt);
    }

    static getDiagramEvaluationPrompt(diagramXML, roundType, problemStatement) {
        const basePrompt = `You are an experienced technical interviewer evaluating a ${roundType.toUpperCase()} diagram submission.

Problem Statement:
${problemStatement}

Diagram XML (draw.io format):
${diagramXML}

Please evaluate this diagram and provide detailed feedback on:`;
        
        if (roundType === 'lld') {
            return `${basePrompt}

1. **Class Design**: Are classes well-defined with appropriate responsibilities?
2. **OOP Principles**: Proper use of encapsulation, inheritance, polymorphism, abstraction
3. **Design Patterns**: Appropriate use of design patterns if applicable
4. **API Design**: Clear method signatures and interfaces
5. **Relationships**: Proper associations, compositions, dependencies
6. **Extensibility**: How easy would it be to extend this design?
7. **SOLID Principles**: Adherence to SOLID principles

Provide specific suggestions for improvement and rate the design on a scale of 1-10.`;
        } else if (roundType === 'hld') {
            return `${basePrompt}

1. **Architecture**: Overall system architecture and component separation
2. **Scalability**: Can this design handle the required scale?
3. **Data Flow**: Clear data flow between components
4. **Technology Choices**: Appropriate database, caching, messaging choices
5. **Load Balancing**: Proper distribution of load
6. **Fault Tolerance**: How does the system handle failures?
7. **Performance**: Bottlenecks and optimization opportunities
8. **Security**: Basic security considerations

Provide specific suggestions for improvement and rate the architecture on a scale of 1-10.`;
        }
        
        return `${basePrompt}

General design principles, clarity, and completeness. Rate on a scale of 1-10.`;
    }
}

// JDoodle Code Execution Service
export class CodeExecutor {
    static async execute(code, language, stdin = "") {
        try {
            const response = await fetch('http://localhost:8001/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: CONFIG.JDOODLE_CLIENT_ID,
                    clientSecret: CONFIG.JDOODLE_CLIENT_SECRET,
                    script: code,
                    stdin: stdin,
                    language: this.mapLanguage(language),
                    versionIndex: "5",
                    compileOnly: false
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                return {
                    output: '',
                    error: result.error,
                    memory: 0,
                    cpuTime: 0
                };
            }
            
            return {
                output: result.output || 'No output',
                error: result.error || null,
                memory: result.memory || 0,
                cpuTime: result.cpuTime || 0
            };
        } catch (error) {
            return {
                output: '',
                error: error.message,
                memory: 0,
                cpuTime: 0
            };
        }
    }

    static async executeWithTestCases(code, language, testCases) {
        if (!testCases || testCases.length === 0) {
            return await this.execute(code, language);
        }

        // Format input: test count first, then all test inputs
        const combinedInput = `${testCases.length}\n${testCases.map(tc => tc.input).join('\n')}`;
        
        try {
            const result = await this.execute(code, language, combinedInput);
            
            if (result.error) {
                return { error: result.error, testResults: [] };
            }
            
            // Parse outputs for each test case
            const outputs = result.output.trim().split('\n');
            const testResults = testCases.map((testCase, index) => {
                const actualOutput = outputs[index] || '';
                const expected = testCase.output.trim();
                const passed = this.isOutputMatch(actualOutput.trim(), expected);
                
                return {
                    input: testCase.input,
                    expected: expected,
                    actual: actualOutput.trim(),
                    passed: passed
                };
            });
            
            return {
                error: null,
                testResults: testResults,
                memory: result.memory,
                cpuTime: result.cpuTime
            };
            
        } catch (error) {
            return { error: error.message, testResults: [] };
        }
    }



    static isOutputMatch(actual, expected) {
        if (actual === expected) return true;
        
        // Flexible matching for numbers
        if (!isNaN(actual) && !isNaN(expected)) {
            return parseFloat(actual) === parseFloat(expected);
        }
        
        // Case insensitive for strings
        return actual.toLowerCase() === expected.toLowerCase();
    }

    static simulateExecution(code, language, stdin = "") {
        // Smart simulation based on code patterns
        let output = '';
        
        if (code.includes('Hello') || code.includes('hello')) {
            output = 'Hello, World!';
        } else if (code.includes('print')) {
            // Extract content from print statements
            const printMatch = code.match(/print\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/);
            output = printMatch ? printMatch[1] : 'Simulated output';
        } else if (code.includes('console.log')) {
            const logMatch = code.match(/console\.log\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/);
            output = logMatch ? logMatch[1] : 'Simulated output';
        } else if (code.includes('factorial')) {
            output = '120';
        } else if (code.includes('fibonacci')) {
            output = '13';
        } else if (code.includes('reverse')) {
            output = 'dcba';
        } else if (code.includes('sum')) {
            output = '15';
        } else {
            output = 'Code executed successfully (simulated)';
        }
        
        return {
            output: output,
            error: null,
            memory: 128,
            cpuTime: 0.05
        };
    }

    static mapLanguage(lang) {
        const mapping = {
            'scala': 'scala',
            'javascript': '',
            'python': 'python3',
            'java': 'java',
            'cpp': 'cpp17'
        };
        return mapping[lang] || 'scala';
    }

    static versionLanguage(lang) {
        const mapping = {
            'scala': 5,
            'javascript': 0,
            'python': 5,
            'java': 5,
            'cpp': 2
        }

        return mapping[lang] || 5;
    }
}