#!/usr/bin/env python3
"""
Example Backend API for Diagram Storage
Run with: python3 backend-api-example.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Simple file-based storage (use database in production)
DIAGRAMS_DIR = 'diagrams'
os.makedirs(DIAGRAMS_DIR, exist_ok=True)

@app.route('/api/diagrams/save', methods=['POST'])
def save_diagram():
    try:
        data = request.get_json()
        round_type = data.get('roundType')
        xml_data = data.get('xml')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        
        if not round_type or not xml_data:
            return jsonify({'error': 'Missing roundType or xml'}), 400
        
        # Save to file
        filename = f"{DIAGRAMS_DIR}/{round_type}_diagram.json"
        diagram_data = {
            'xml': xml_data,
            'timestamp': timestamp,
            'roundType': round_type
        }
        
        with open(filename, 'w') as f:
            json.dump(diagram_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': f'Diagram saved for {round_type}',
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagrams/load/<round_type>', methods=['GET'])
def load_diagram(round_type):
    try:
        filename = f"{DIAGRAMS_DIR}/{round_type}_diagram.json"
        
        if not os.path.exists(filename):
            return jsonify({'xml': '', 'message': 'No diagram found'})
        
        with open(filename, 'r') as f:
            diagram_data = json.load(f)
        
        return jsonify({
            'xml': diagram_data.get('xml', ''),
            'timestamp': diagram_data.get('timestamp'),
            'roundType': diagram_data.get('roundType')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagrams/list', methods=['GET'])
def list_diagrams():
    try:
        diagrams = []
        for filename in os.listdir(DIAGRAMS_DIR):
            if filename.endswith('_diagram.json'):
                round_type = filename.replace('_diagram.json', '')
                diagrams.append(round_type)
        
        return jsonify({'diagrams': diagrams})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Diagram API server...")
    print("📊 Endpoints:")
    print("   POST /api/diagrams/save - Save diagram")
    print("   GET  /api/diagrams/load/<round_type> - Load diagram")
    print("   GET  /api/diagrams/list - List all diagrams")
    print("")
    app.run(debug=True, port=5000)