// Diagrams.net Integration for LLD/HLD Rounds
export class DiagramEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.iframe = null;
        this.isReady = false;
        this.currentXML = '';
        this.onSaveCallback = null;
        
        this.setupMessageListener();
    }

    // Create and embed the iframe
    embed(diagramXML = '') {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create iframe
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'https://embed.diagrams.net/?embed=1&proto=json&spin=1';
        this.iframe.style.cssText = `
            width: 100%;
            height: 500px;
            border: 1px solid #ccc;
            border-radius: 6px;
        `;
        
        container.innerHTML = '';
        container.appendChild(this.iframe);
        
        this.currentXML = diagramXML;
    }

    // Setup message listener for iframe communication
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://embed.diagrams.net') return;
            
            const msg = JSON.parse(event.data);
            
            switch (msg.event) {
                case 'init':
                    this.handleInit();
                    break;
                case 'save':
                    this.handleSave(msg.xml);
                    break;
                case 'exit':
                    this.handleExit();
                    break;
            }
        });
    }

    // Handle editor initialization
    handleInit() {
        this.isReady = true;
        
        if (this.currentXML) {
            this.loadDiagram(this.currentXML);
        } else {
            // Load empty diagram
            this.sendMessage({
                action: 'load',
                xml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'
            });
        }
    }

    // Handle save event from editor
    handleSave(xml) {
        this.currentXML = xml;
        
        if (this.onSaveCallback) {
            this.onSaveCallback(xml);
        }
        
        // Auto-save to localStorage as backup
        localStorage.setItem(`diagram_${this.containerId}`, xml);
    }

    // Handle exit event
    handleExit() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '<p>Diagram editor closed. Click "Open Diagram Editor" to reopen.</p>';
        }
    }

    // Send message to iframe
    sendMessage(msg) {
        if (this.iframe && this.isReady) {
            this.iframe.contentWindow.postMessage(JSON.stringify(msg), 'https://embed.diagrams.net');
        }
    }

    // Load diagram with XML data
    loadDiagram(xml) {
        this.sendMessage({
            action: 'load',
            xml: xml
        });
    }

    // Trigger save
    save() {
        this.sendMessage({ action: 'save' });
    }

    // Close editor
    exit() {
        this.sendMessage({ action: 'exit' });
    }

    // Set callback for save events
    onSave(callback) {
        this.onSaveCallback = callback;
    }

    // Get current diagram XML
    getCurrentXML() {
        return this.currentXML;
    }
}

// API Integration Functions
export class DiagramAPI {
    static async saveDiagram(roundType, xml) {
        try {
            const response = await fetch('/api/diagrams/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roundType: roundType,
                    xml: xml,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('API save failed, using localStorage:', error);
            localStorage.setItem(`diagram_${roundType}`, xml);
            return { success: true, storage: 'local' };
        }
    }

    static async loadDiagram(roundType) {
        try {
            const response = await fetch(`/api/diagrams/load/${roundType}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data.xml || '';
        } catch (error) {
            console.warn('API load failed, using localStorage:', error);
            return localStorage.getItem(`diagram_${roundType}`) || '';
        }
    }
}