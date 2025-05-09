/**
 * Keyboard Controller for Chess Games
 * Handles keyboard navigation and interactions for both standard and n-dimensional chess
 */

class KeyboardController {
  constructor(config) {
    this.camera = config.camera;
    this.controls = config.controls;
    this.scene = config.scene;
    this.raycaster = config.raycaster;
    
    // Game state functions
    this.handlePieceSelection = config.handlePieceSelection || (() => {});
    this.handleTileSelection = config.handleTileSelection || (() => {});
    this.deselectPiece = config.deselectPiece || (() => {});
    this.getSelectedPiece = config.getSelectedPiece || (() => null);
    this.getValidMoves = config.getValidMoves || (() => []);
    
    // Optional dimension controls
    this.toggleDimension = config.toggleDimension || null;
    this.changeSlice = config.changeSlice || null;
    
    // Keyboard state
    this.keys = {};
    this.cursorPosition = new THREE.Vector3(0, 0, 0);
    this.lastRender = 0;
    this.cursorMesh = null;
    this.cursorVisible = false;
    
    // Movement speed and cooldown
    this.moveSpeed = 1.0; // Regular movement speed
    this.moveCooldown = 150; // Milliseconds between cursor movements
    this.rotateSpeed = 0.1; // Camera rotation speed
    this.zoomSpeed = 2.0; // Zoom speed
    
    // Initialize
    this.createCursor();
    this.setupEventListeners();
    this.createKeyboardControlsPanel();
  }
  
  createCursor() {
    // Create a cursor to show keyboard focus
    const cursorGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cursorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00, 
      transparent: true, 
      opacity: 0.7,
      wireframe: true 
    });
    
    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
    this.cursorMesh.position.set(0, 0.5, 0);
    this.cursorMesh.visible = false;
    this.scene.add(this.cursorMesh);
  }
  
  setupEventListeners() {
    // Listen for keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
  }
  
  handleKeyDown(event) {
    // Record key state
    this.keys[event.key] = true;
    
    // Show cursor when keyboard navigation starts
    if (!this.cursorVisible && this.isNavigationKey(event.key)) {
      this.showCursor();
    }
    
    // Handle special key combinations
    if (event.key === '?') {
      // Show keyboard controls panel
      this.toggleKeyboardControlsPanel();
    }
    
    // Handle single keypress actions
    this.handleKeypressActions(event);
  }
  
  handleKeyUp(event) {
    // Remove key from pressed keys
    delete this.keys[event.key];
  }
  
  handleBlur() {
    // Clear all key states when window loses focus
    this.keys = {};
  }
  
  isNavigationKey(key) {
    const navKeys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    return navKeys.includes(key);
  }
  
  showCursor() {
    // Make cursor visible
    this.cursorVisible = true;
    this.cursorMesh.visible = true;
    
    // Position cursor at camera focus
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.normalize();
    
    // Cast ray from camera to find a tile
    this.raycaster.set(this.camera.position, direction);
    const intersects = this.raycaster.intersectObjects(this.scene.children, false);
    
    // Find first intersected tile
    for (const intersect of intersects) {
      // Check if we hit a tile
      if (intersect.object.userData && intersect.object.userData.isTile) {
        // Position cursor to this tile
        this.cursorPosition.copy(intersect.object.position);
        this.cursorPosition.y = 0.5; // Position above the tile
        this.cursorMesh.position.copy(this.cursorPosition);
        return;
      }
    }
    
    // If no tile found, place at origin
    this.cursorPosition.set(0, 0.5, 0);
    this.cursorMesh.position.copy(this.cursorPosition);
  }
  
  hideCursor() {
    this.cursorVisible = false;
    this.cursorMesh.visible = false;
  }
  
  update(timestamp) {
    // Only update at certain intervals to prevent too rapid movement
    if (timestamp - this.lastRender < this.moveCooldown) {
      return;
    }
    
    // Handle continuous keypress actions (movement, rotation, etc.)
    if (Object.keys(this.keys).length > 0) {
      let positionChanged = false;
      
      // Camera rotation with Q/E or brackets
      if (this.keys['q'] || this.keys['[']) {
        this.controls.rotateLeft(this.rotateSpeed);
      }
      if (this.keys['e'] || this.keys[']']) {
        this.controls.rotateRight(this.rotateSpeed);
      }
      
      // Zoom with Z/X or +/-
      if (this.keys['z'] || this.keys['='] || this.keys['+']) {
        this.controls.dollyIn(this.zoomSpeed);
      }
      if (this.keys['x'] || this.keys['-'] || this.keys['_']) {
        this.controls.dollyOut(this.zoomSpeed);
      }
      
      // WASD or Arrow key movement
      if (this.keys['w'] || this.keys['ArrowUp']) {
        this.cursorPosition.z -= this.moveSpeed;
        positionChanged = true;
      }
      if (this.keys['s'] || this.keys['ArrowDown']) {
        this.cursorPosition.z += this.moveSpeed;
        positionChanged = true;
      }
      if (this.keys['a'] || this.keys['ArrowLeft']) {
        this.cursorPosition.x -= this.moveSpeed;
        positionChanged = true;
      }
      if (this.keys['d'] || this.keys['ArrowRight']) {
        this.cursorPosition.x += this.moveSpeed;
        positionChanged = true;
      }
      
      // Dimension navigation (if available)
      if (this.changeSlice) {
        // Navigate 4th dimension with R/F
        if (this.keys['r']) {
          this.changeSlice(3, 1);
          positionChanged = true;
        }
        if (this.keys['f']) {
          this.changeSlice(3, -1);
          positionChanged = true;
        }
        
        // Navigate 5th dimension with T/G
        if (this.keys['t']) {
          this.changeSlice(4, 1);
          positionChanged = true;
        }
        if (this.keys['g']) {
          this.changeSlice(4, -1);
          positionChanged = true;
        }
        
        // Navigate 6th dimension with Y/H
        if (this.keys['y']) {
          this.changeSlice(5, 1);
          positionChanged = true;
        }
        if (this.keys['h']) {
          this.changeSlice(5, -1);
          positionChanged = true;
        }
      }
      
      // Update cursor position
      if (positionChanged) {
        this.cursorMesh.position.copy(this.cursorPosition);
        this.lastRender = timestamp;
      }
    }
  }
  
  handleKeypressActions(event) {
    // Space to select/deselect
    if (event.key === ' ' || event.key === 'Enter') {
      this.selectAtCursor();
    }
    
    // Toggle dimensions with number keys (0-6)
    if (this.toggleDimension && /^[0-6]$/.test(event.key)) {
      const dimension = parseInt(event.key, 10);
      this.toggleDimension(dimension);
    }
    
    // Escape to cancel selection
    if (event.key === 'Escape') {
      this.deselectPiece();
    }
  }
  
  selectAtCursor() {
    // Cast ray from cursor position downward
    const rayOrigin = new THREE.Vector3(
      this.cursorPosition.x,
      this.cursorPosition.y + 2, // Start above cursor
      this.cursorPosition.z
    );
    const rayDirection = new THREE.Vector3(0, -1, 0); // Downward
    
    this.raycaster.set(rayOrigin, rayDirection);
    const intersects = this.raycaster.intersectObjects(this.scene.children, false);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      
      // If we have a selected piece and click on a tile
      if (this.getSelectedPiece() && object.userData && object.userData.isTile) {
        this.handleTileSelection(object);
        return;
      }
      
      // If we click on a piece
      if (object.userData && object.userData.isPiece) {
        this.handlePieceSelection(object);
        return;
      }
    }
    
    // If we clicked on nothing, deselect
    this.deselectPiece();
  }
  
  createKeyboardControlsPanel() {
    // Create a panel to display keyboard controls
    const panel = document.createElement('div');
    panel.id = 'keyboard-controls-panel';
    panel.className = 'controls-panel keyboard-controls';
    panel.style.display = 'none';
    
    // Set panel styling
    Object.assign(panel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(33, 37, 41, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      zIndex: '1000',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
    });
    
    // Populate with controls information
    panel.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="m-0">Keyboard Controls</h4>
        <button id="close-keyboard-controls" class="btn btn-sm btn-dark">×</button>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <h5>Navigation</h5>
          <ul class="list-unstyled">
            <li><kbd>W</kbd> / <kbd>↑</kbd> - Move forward</li>
            <li><kbd>S</kbd> / <kbd>↓</kbd> - Move backward</li>
            <li><kbd>A</kbd> / <kbd>←</kbd> - Move left</li>
            <li><kbd>D</kbd> / <kbd>→</kbd> - Move right</li>
            <li><kbd>Space</kbd> / <kbd>Enter</kbd> - Select at cursor</li>
            <li><kbd>Esc</kbd> - Cancel selection</li>
          </ul>
          
          <h5>Camera Controls</h5>
          <ul class="list-unstyled">
            <li><kbd>Q</kbd> / <kbd>[</kbd> - Rotate left</li>
            <li><kbd>E</kbd> / <kbd>]</kbd> - Rotate right</li>
            <li><kbd>Z</kbd> / <kbd>+</kbd> - Zoom in</li>
            <li><kbd>X</kbd> / <kbd>-</kbd> - Zoom out</li>
          </ul>
        </div>
        
        <div class="col-md-6">
          <h5>Dimension Controls</h5>
          <ul class="list-unstyled">
            <li><kbd>0</kbd>-<kbd>6</kbd> - Toggle dimensions</li>
            <li><kbd>R</kbd>/<kbd>F</kbd> - 4th dimension +/-</li>
            <li><kbd>T</kbd>/<kbd>G</kbd> - 5th dimension +/-</li>
            <li><kbd>Y</kbd>/<kbd>H</kbd> - 6th dimension +/-</li>
          </ul>
          
          <h5>Other Controls</h5>
          <ul class="list-unstyled">
            <li><kbd>?</kbd> - Show/hide this help</li>
          </ul>
        </div>
      </div>
      
      <p class="mt-3 small text-muted">Note: Keyboard controls and mouse controls can be used interchangeably.</p>
    `;
    
    document.body.appendChild(panel);
    
    // Add close button handler
    document.getElementById('close-keyboard-controls').addEventListener('click', () => {
      this.toggleKeyboardControlsPanel();
    });
    
    // Add button to info panel
    const infoPanels = document.querySelectorAll('.info-panel, #info-panel');
    infoPanels.forEach(panel => {
      if (panel) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mt-3';
        buttonContainer.innerHTML = `
          <button id="keyboard-controls-btn" class="btn btn-secondary w-100">
            <i class="bi bi-keyboard"></i> Keyboard Controls
          </button>
        `;
        
        panel.appendChild(buttonContainer);
        
        document.getElementById('keyboard-controls-btn').addEventListener('click', () => {
          this.toggleKeyboardControlsPanel();
        });
      }
    });
  }
  
  toggleKeyboardControlsPanel() {
    const panel = document.getElementById('keyboard-controls-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  }
}

// Export for ES modules
export { KeyboardController };