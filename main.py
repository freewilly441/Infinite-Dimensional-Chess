from flask import Flask, render_template
import os
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Constants
STATIC_DIR = "static"
TEMPLATES_DIR = "templates"
THREE_JS_URL = "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"
THREE_JS_LOCAL = os.path.join(STATIC_DIR, "three.min.js")
ORBIT_CONTROLS_URL = "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/js/controls/OrbitControls.js"
ORBIT_CONTROLS_LOCAL = os.path.join(STATIC_DIR, "OrbitControls.js")

# Ensure directories exist
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Download Three.js if not already there
if not os.path.exists(THREE_JS_LOCAL):
    logger.info("Downloading Three.js...")
    r = requests.get(THREE_JS_URL)
    with open(THREE_JS_LOCAL, "wb") as f:
        f.write(r.content)
else:
    logger.info("Three.js already exists.")

# Download OrbitControls if not already there
if not os.path.exists(ORBIT_CONTROLS_LOCAL):
    logger.info("Downloading OrbitControls...")
    r = requests.get(ORBIT_CONTROLS_URL)
    with open(ORBIT_CONTROLS_LOCAL, "wb") as f:
        f.write(r.content)
else:
    logger.info("OrbitControls already exists.")

# Flask app
app = Flask(__name__, static_folder=STATIC_DIR, template_folder=TEMPLATES_DIR)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

@app.route("/")
def index():
    return render_template("index.html")

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Server error: {e}")
    return render_template('index.html'), 500

# Run server
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
