// Monaco Editor Integration
export class CodeEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.editor = null;
        this.currentLanguage = 'scala';
        this.testCases = [];
    }

    async initialize(testCases = []) {
        // Load Monaco Editor
        await this.loadMonaco();
        
        this.testCases = testCases;
        this.editor = monaco.editor.create(this.container, {
            value: this.generateBoilerplate(this.currentLanguage, testCases),
            language: this.currentLanguage,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false
        });
    }

    async loadMonaco() {
        return new Promise((resolve) => {
            if (window.monaco) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
            script.onload = () => {
                require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
                require(['vs/editor/editor.main'], () => {
                    resolve();
                });
            };
            document.head.appendChild(script);
        });
    }

    setLanguage(language) {
        if (this.editor) {
            this.currentLanguage = language;
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
            this.editor.setValue(this.generateBoilerplate(language, this.testCases));
        }
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    getDefaultCode(language) {
        const templates = {
            scala: `import scala.io.StdIn

object Solution {
  def main(args: Array[String]): Unit = {
    val t = StdIn.readLine().toInt
    for (_ <- 1 to t) {
      val input = StdIn.readLine()
      val result = solve(input)
      println(result)
    }
  }
  
  def solve(input: String): String = {
    // Parse input and implement your solution
    // Example: val n = input.toInt
    
    // Your code here
    input // Replace with actual solution
  }
}`,
            javascript: `const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function solve(input) {
  // Parse input and implement your solution
  // Example: const n = parseInt(input.trim());
  
  // Your code here
  return input.trim(); // Replace with actual solution
}

let t, count = 0;
rl.on('line', (line) => {
  if (count === 0) {
    t = parseInt(line);
  } else {
    const result = solve(line);
    console.log(result);
    if (count === t) rl.close();
  }
  count++;
});`,
            python: `def solve(input_str):
    # Parse input and implement your solution
    # Example: n = int(input_str.strip())
    
    # Your code here
    return input_str.strip()  # Replace with actual solution

if __name__ == "__main__":
    t = int(input())
    for _ in range(t):
        input_str = input()
        result = solve(input_str)
        print(result)`,
            java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int t = scanner.nextInt();
        scanner.nextLine();
        
        for (int i = 0; i < t; i++) {
            String input = scanner.nextLine();
            Solution sol = new Solution();
            String result = sol.solve(input);
            System.out.println(result);
        }
        scanner.close();
    }
    
    public String solve(String input) {
        // Parse input and implement your solution
        // Example: int n = Integer.parseInt(input.trim());
        
        // Your code here
        return input.trim(); // Replace with actual solution
    }
}`,
            cpp: `#include <iostream>
#include <string>
using namespace std;

string solve(string input) {
    // Parse input and implement your solution
    // Example: int n = stoi(input);
    
    // Your code here
    return input; // Replace with actual solution
}

int main() {
    int t;
    cin >> t;
    cin.ignore();
    
    for (int i = 0; i < t; i++) {
        string input;
        getline(cin, input);
        string result = solve(input);
        cout << result << endl;
    }
    return 0;
}`
        };
        return templates[language] || templates.scala;
    }

    generateBoilerplate(language, testCases = []) {
        const template = this.getDefaultCode(language);
        
        if (testCases.length > 0) {
            const sampleInput = testCases[0].input;
            const sampleOutput = testCases[0].output;
            
            // Add comments with sample test case
            const commentedTemplate = template.replace(
                /(\/\/ Your code here|# Your code here)/,
                `// Sample: Input="${sampleInput}" -> Output="${sampleOutput}"
    $1`
            );
            
            return commentedTemplate;
        }
        
        return template;
    }

    setTestCases(testCases) {
        this.testCases = testCases;
        if (this.editor) {
            this.editor.setValue(this.generateBoilerplate(this.currentLanguage, testCases));
        }
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}