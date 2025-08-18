// Configuration and Constants
export const CONFIG = {
    GEMINI_API_KEY: window.API_KEYS?.GEMINI_API_KEY || 'your_gemini_api_key_here',
    GEMINI_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    JDOODLE_CLIENT_ID: window.API_KEYS?.JDOODLE_CLIENT_ID || 'your_jdoodle_client_id_here',
    JDOODLE_CLIENT_SECRET: window.API_KEYS?.JDOODLE_CLIENT_SECRET || 'your_jdoodle_client_secret_here'
};

export const ROUNDS = {
    dsa: {
        title: 'Data Structures & Algorithms',
        welcome: 'Welcome to the DSA round. I will present a problem, and you\'ll explain your approach and write code. Ready to begin?',
        buttons: ['Explain Approach', 'Run Code', 'Ask for Hint'],
        showCode: true,
        languages: ['scala', 'javascript', 'python', 'java', 'cpp']
    },
    lld: {
        title: 'Low-Level Design',
        welcome: 'Welcome to the LLD round. You\'ll design a component with classes, APIs, and OOP principles. Ready to start?',
        buttons: ['Propose Design', 'Clarify Requirement'],
        showCode: false
    },
    hld: {
        title: 'High-Level Design',
        welcome: 'Welcome to the HLD round. Design a large-scale system architecture. Think about scalability and technology choices. Ready?',
        buttons: ['Propose Architecture', 'Ask for Clarification'],
        showCode: false
    },
    behavioral: {
        title: 'Behavioral Round',
        welcome: 'Welcome to the Behavioral round. I\'ll ask about your experiences and how you handle challenges. Be open and reflective. Ready?',
        buttons: ['Submit Answer'],
        showCode: false
    }
};