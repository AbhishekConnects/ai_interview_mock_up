// Monaco Editor Integration
export class CodeEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.editor = null;
        this.currentLanguage = 'scala';
    }

    async initialize() {
        // Load Monaco Editor
        await this.loadMonaco();
        
        this.editor = monaco.editor.create(this.container, {
            value: this.getDefaultCode(this.currentLanguage),
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
            this.editor.setValue(this.getDefaultCode(language));
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
            scala: `// Write your solution here
object Solution {
  def main(args: Array[String]): Unit = {
    val result = solve()
    println(result)
  }
  
  def solve(): Int = {
    // Your code here
    0
  }
}`,
            javascript: `// Write your solution here
function solution() {
    // Your code here
    return result;
}

console.log(solution());`,
            python: `# Write your solution here
def solution():
    # Your code here
    return result

print(solution())`,
            java: `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.solve());
    }
    
    public int solve() {
        // Your code here
        return 0;
    }
}`,
            cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    cout << "Hello World" << endl;
    return 0;
}`
        };
        return templates[language] || templates.scala;
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}