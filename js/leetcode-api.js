// LeetCode API Service
export class LeetCodeAPI {
    static BASE_URL = 'https://alfa-leetcode-api.onrender.com';
    
    static async getProblems(difficulty = 'EASY') {
        try {
            const response = await fetch(`${this.BASE_URL}/problems?difficulty=${difficulty.toUpperCase()}`);
            const data = await response.json();
            return data.problemsetQuestionList || [];
        } catch (error) {
            console.error('Error fetching problems:', error);
            return [];
        }
    }
    
    static async getProblemDetails(titleSlug) {
        try {
            const response = await fetch(`${this.BASE_URL}/select?titleSlug=${titleSlug}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching problem details:', error);
            return null;
        }
    }
    
    static async getRandomProblem(difficulty = 'easy') {
        const problems = await this.getProblems(difficulty);
        if (problems.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * problems.length);
        const selectedProblem = problems[randomIndex];
        
        const details = await this.getProblemDetails(selectedProblem.titleSlug);
        return details;
    }
    
    static formatProblemForDisplay(problemData) {
        if (!problemData) return 'Failed to load problem';
        
        let formatted = `<strong>${problemData.questionTitle}</strong>\n\n`;
        formatted += `<strong>Difficulty:</strong> ${problemData.difficulty}\n\n`;
        
        // Clean HTML content and convert to readable text
        const cleanContent = problemData.question
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        
        formatted += `${cleanContent}\n\n`;
        
        if (problemData.exampleTestcases) {
            formatted += `<strong>Example Test Cases:</strong>\n`;
            const testCases = problemData.exampleTestcases.split('\n');
            testCases.forEach((testCase, index) => {
                if (testCase.trim()) {
                    formatted += `Input ${index + 1}: ${testCase}\n`;
                }
            });
        }
        
        return formatted;
    }
    
    static extractTestCases(problemData) {
        if (!problemData || !problemData.exampleTestcases) {
            return [
                { input: '5', output: '5' },
                { input: '10', output: '10' },
                { input: '1', output: '1' }
            ];
        }
        
        const testCases = [];
        const examples = problemData.exampleTestcases.split('\n').filter(line => line.trim());
        
        // Extract expected outputs from the problem question HTML
        const outputMatches = problemData.question.match(/<strong>Output:<\/strong>\s*([^<]+)/g);
        const outputs = outputMatches ? outputMatches.map(match => 
            match.replace(/<strong>Output:<\/strong>\s*/, '').trim()
        ) : [];
        
        // Pair inputs with outputs
        examples.forEach((input, index) => {
            const output = outputs[index] || input; // Fallback to input if no output found
            testCases.push({
                input: input.trim(),
                output: output.trim()
            });
        });
        
        return testCases.length > 0 ? testCases : [
            { input: '5', output: '5' },
            { input: '10', output: '10' },
            { input: '1', output: '1' }
        ];
    }
}