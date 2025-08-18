# AI Mock Interview System

A comprehensive AI-powered interview practice platform with multiple rounds and real-time code execution.

## Features

### 🎯 Interview Rounds
- **DSA Round**: Coding problems with Monaco Editor and real-time execution
- **Low-Level Design**: Component design with OOP principles
- **High-Level Design**: System architecture and scalability
- **Behavioral**: STAR method questions and soft skills

### 🛠️ Technical Features
- **Monaco Editor**: Professional code editor with syntax highlighting
- **Multi-Language Support**: Scala 3 (default), JavaScript, Python, Java, C++
- **Real Code Execution**: JDoodle API integration
- **Voice & Text Input**: Dual input modes
- **Problem Persistence**: Problems saved across round switches
- **AI Feedback**: Powered by Google Gemini 2.0 Flash

## Setup

### 1. API Keys Required
```javascript
// Update js/config.js
GEMINI_API_KEY: 'your_gemini_api_key'
JDOODLE_CLIENT_ID: 'your_jdoodle_client_id'
JDOODLE_CLIENT_SECRET: 'your_jdoodle_secret'
```

### 2. Get API Keys
- **Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **JDoodle API**: [JDoodle Compiler API](https://www.jdoodle.com/compiler-api)

### 3. Run Locally
```bash
# Method 1: Full setup (web + code execution)
./start.sh

# Method 2: Manual setup
# Terminal 1: Start proxy for code execution
python3 proxy-server.py

# Terminal 2: Start web server
python3 server.py
```

**⚠️ Important**: 
- ES6 modules require HTTP server - don't open index.html directly!
- For real code execution, both servers must be running
- Demo mode works with just the web server

## Usage

1. **Select Round**: Click any round in sidebar to begin
2. **Choose Input**: Voice 🎤 or Text ✏️ mode
3. **Code (DSA)**: Use Monaco Editor with language selection
4. **Execute Code**: "Run Code" button for real-time execution
5. **Get Feedback**: AI analyzes and provides detailed feedback
6. **Switch Rounds**: Problems persist until page reload

## Architecture

```
js/
├── app.js      # Main application orchestrator
├── config.js   # API keys & configurations
├── state.js    # Problem persistence & state
├── api.js      # Gemini & JDoodle services
├── editor.js   # Monaco Editor integration
├── rounds.js   # Round management logic
├── speech.js   # Voice recognition
└── ui.js       # UI interactions
```

## Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Limited speech recognition
- **Safari**: Basic functionality

## Key Improvements

✅ **Problem Persistence**: Switch rounds without losing problems  
✅ **Monaco Editor**: Professional coding environment  
✅ **Real Execution**: Actual code compilation via JDoodle  
✅ **Modular Design**: Clean, maintainable architecture  
✅ **Multi-Language**: Support for 5+ programming languages with Scala 3 default  
✅ **Test Cases**: Automated test case generation and execution  

## Demo Flow

1. Start with DSA round → Get coding problem
2. Write solution in Monaco Editor (any language)
3. Execute code → See real output/errors
4. Switch to LLD round → Design components
5. Complete all rounds → Get overall feedback

Perfect for technical interview preparation! 🚀