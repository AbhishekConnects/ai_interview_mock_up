// Speech Recognition Module
export class SpeechManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.initializeSpeechRecognition();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.onTranscript(transcript);
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.onEnd();
            };

            this.recognition.onerror = (event) => {
                this.onError(event.error);
            };
        }
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
            this.isListening = true;
            return true;
        }
        return false;
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    onTranscript(transcript) {
        // Override in implementation
        console.log('Transcript:', transcript);
    }

    onEnd() {
        // Override in implementation
        console.log('Speech recognition ended');
    }

    onError(error) {
        // Override in implementation
        console.error('Speech recognition error:', error);
    }

    isSupported() {
        return 'webkitSpeechRecognition' in window;
    }
}