/**
 * N-Dimensional Chess Simulation
 * 
 * A simulation of chess in arbitrary dimensions with hyperpiece movement rules,
 * dimensional fatigue mechanics, and togglable dimensional views.
 */

// Import Three.js
import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

// Constants
const TILE_SIZE = 1.0;
const VISIBLE_RANGE = 10;
const LOAD_THRESHOLD = 3;
const MAX_DIMENSIONS = 6; // Maximum number of dimensions supported
const DEFAULT_DIMENSIONS = 3; // Default dimensions to start with
const CHUNK_SIZE = 5; // Size of each chunk for generation

// Materials
const WHITE_MATERIAL = new THREE.MeshStandardMaterial({ 
  color: 0xeeeeee, 
  roughness: 0.4, 
  metalness: 0.1
});

const BLACK_MATERIAL = new THREE.MeshStandardMaterial({ 
  color: 0x333333, 
  roughness: 0.4, 
  metalness: 0.1
});

const ORIGIN_MATERIAL = new THREE.MeshStandardMaterial({ 
  color: 0x00aaff, 
  roughness: 0.2, 
  metalness: 0.5
});

const SELECTED_PIECE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.5
});

const VALID_MOVE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.3
});

const CAPTURE_MOVE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.3
});

const DIMENSION_COLORS = [
  0xff0000, // Red - X axis (1st dimension)
  0x0000ff, // Blue - Z axis (2nd dimension)
  0x00ff00, // Green - Y axis (3rd dimension)
  0xffff00, // Yellow - 4th dimension
  0xff00ff, // Magenta - 5th dimension
  0x00ffff, // Cyan - 6th dimension
];

// Piece types and colors
const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king',
  HYPERROOK: 'hyperrook',
  HYPERBISHOP: 'hyperbishop',
  HYPERKNIGHT: 'hyperknight'
};

const PIECE_COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Game state variables
let scene, camera, renderer, controls, raycaster, mouse;
let activeDimensions = DEFAULT_DIMENSIONS;
let viewDimensions = [0, 1, 2]; // Which dimensions to visualize (X, Z, Y by default)
let dimensionalFatigue = true; // Whether to apply dimensional fatigue mechanic
let board = {}; // Dictionary to store board tiles keyed by coordinate tuples
let pieces = {}; // Dictionary to store pieces keyed by coordinate tuples
let selectedPiece = null;
let validMoves = [];
let currentTurn = PIECE_COLORS.WHITE;
let lastCameraPosition = { x: 0, y: 0, z: 0 };
let moveSound, captureSound;
let capturedPieces = {
  [PIECE_COLORS.WHITE]: [],
  [PIECE_COLORS.BLACK]: []
};
let moveHighlights = [];
let visualizationControls = {
  sliceCoordinates: Array(MAX_DIMENSIONS).fill(0) // For visualizing specific slices
};

// HTML element references
let positionDisplay, gameStatusElement;

// Initialize the application
function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121212);
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(15, 15, 15);
  camera.lookAt(0, 0, 0);
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  
  // Raycaster for piece selection
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // Controls setup
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.screenSpacePanning = false;
  controls.minDistance = 5;
  controls.maxDistance = 100;
  
  // Lighting setup
  setupLighting();
  
  // Add orientation axes for visualizing dimensions
  addOrientationAxes();
  
  // Create initial board state and pieces
  initializeBoard();
  
  // Load sound effects
  loadSoundEffects();
  
  // Create dimensional particles
  createDimensionalParticles();
  
  // Setup dimensional visualization controls
  setupDimensionalControls();
  
  // Reference to HTML elements
  positionDisplay = document.getElementById('position-display');
  gameStatusElement = document.getElementById('current-turn');
  updateGameStatus();
  
  // Hide loading overlay
  document.getElementById('loading-overlay').style.display = 'none';
  
  // Event listeners
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('click', onMouseClick);
  
  // Start the render loop
  animate();
}

// Load sound effects
function loadSoundEffects() {
  // Create audio elements
  moveSound = new Audio('/static/sounds/move.mp3');
  captureSound = new Audio('/static/sounds/capture.mp3');
  
  // Preload sounds
  moveSound.load();
  captureSound.load();
}

// Set up scene lighting
function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  
  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  
  scene.add(directionalLight);
  
  // Additional softer directional light from another angle
  const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.3);
  secondaryLight.position.set(-5, 10, -5);
  scene.add(secondaryLight);
}

// Add orientation axes to help visualize dimensions
function addOrientationAxes() {
  // Create a group for the axes
  const axesGroup = new THREE.Group();
  axesGroup.name = 'dimensionAxes';
  
  // Create axes for each dimension
  for (let d = 0; d < MAX_DIMENSIONS; d++) {
    const color = DIMENSION_COLORS[d % DIMENSION_COLORS.length];
    
    // Only show axes for the first few dimensions initially
    const visible = d < DEFAULT_DIMENSIONS;
    
    // Create direction vector (initialize to zero)
    const direction = new THREE.Vector3(0, 0, 0);
    
    // Set the appropriate component to 1
    if (d === 0) direction.x = 1;      // 1st dimension - X axis
    else if (d === 1) direction.z = 1;  // 2nd dimension - Z axis
    else if (d === 2) direction.y = 1;  // 3rd dimension - Y axis
    // For higher dimensions, we'll visualize them along offset vectors when needed
    
    // Create arrow helper
    const arrow = new THREE.ArrowHelper(
      direction,
      new THREE.Vector3(0, 0.1, 0),
      5,
      color,
      0.5,
      0.2
    );
    
    arrow.visible = visible;
    arrow.userData.dimension = d;
    
    // Add to group
    axesGroup.add(arrow);
    
    // Add dimension label
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'dimension-label';
    dimensionLabel.style.color = `#${color.toString(16).padStart(6, '0')}`;
    dimensionLabel.innerHTML = `D${d+1}`;
    
    if (!visible) {
      dimensionLabel.style.display = 'none';
    }
    
    document.getElementById('dimension-labels').appendChild(dimensionLabel);
  }
  
  scene.add(axesGroup);
}

// Set up dimensional controls
function setupDimensionalControls() {
  const controlsDiv = document.getElementById('dimension-controls');
  
  // Create dimension toggle buttons
  for (let d = 0; d < MAX_DIMENSIONS; d++) {
    const color = DIMENSION_COLORS[d % DIMENSION_COLORS.length];
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;
    
    // Dimension toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-sm';
    toggleBtn.style.backgroundColor = colorHex;
    toggleBtn.style.color = '#fff';
    toggleBtn.innerText = `D${d+1}`;
    toggleBtn.dataset.dimension = d;
    
    // Active by default for the first few dimensions
    if (d < DEFAULT_DIMENSIONS) {
      toggleBtn.classList.add('active');
    } else {
      toggleBtn.classList.add('btn-outline');
    }
    
    // Add event listener
    toggleBtn.addEventListener('click', () => {
      toggleDimension(d);
      toggleBtn.classList.toggle('active');
    });
    
    controlsDiv.appendChild(toggleBtn);
    
    // Add slider for slice position (for dimensions > 3)
    if (d >= 3) {
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'slice-control';
      sliderContainer.style.display = 'none'; // Hide initially
      
      const sliderLabel = document.createElement('label');
      sliderLabel.innerText = `D${d+1} Slice:`;
      sliderLabel.htmlFor = `slice-d${d}`;
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = `slice-d${d}`;
      slider.min = -10;
      slider.max = 10;
      slider.value = 0;
      
      slider.addEventListener('input', (e) => {
        updateSliceVisualization(d, parseInt(e.target.value));
      });
      
      sliderContainer.appendChild(sliderLabel);
      sliderContainer.appendChild(slider);
      controlsDiv.appendChild(sliderContainer);
    }
  }
  
  // Add dimensional fatigue toggle
  const fatigueToggle = document.createElement('button');
  fatigueToggle.className = 'btn btn-info btn-sm mt-2';
  fatigueToggle.innerText = 'Dimensional Fatigue: ON';
  fatigueToggle.addEventListener('click', () => {
    dimensionalFatigue = !dimensionalFatigue;
    fatigueToggle.innerText = `Dimensional Fatigue: ${dimensionalFatigue ? 'ON' : 'OFF'}`;
  });
  
  controlsDiv.appendChild(fatigueToggle);
}

// Toggle a dimension on/off
function toggleDimension(dimension) {
  // Find dimension in active dimensions
  const index = activeDimensions.indexOf(dimension);
  
  if (index === -1) {
    // Add dimension
    activeDimensions = [...activeDimensions, dimension].sort();
    
    // Show axis
    const axesGroup = scene.getObjectByName('dimensionAxes');
    axesGroup.children.forEach(arrow => {
      if (arrow.userData.dimension === dimension) {
        arrow.visible = true;
      }
    });
    
    // Show dimension label
    const labels = document.getElementsByClassName('dimension-label');
    if (labels[dimension]) {
      labels[dimension].style.display = 'block';
    }
    
    // Show slice control if dimension > 3
    if (dimension >= 3) {
      const sliceControl = document.querySelector(`.slice-control:nth-of-type(${dimension - 2})`);
      if (sliceControl) {
        sliceControl.style.display = 'block';
      }
    }
    
  } else {
    // Can't have fewer than 3 dimensions
    if (activeDimensions.length <= 3) {
      alert("Cannot have fewer than 3 dimensions active");
      return;
    }
    
    // Remove dimension
    activeDimensions.splice(index, 1);
    
    // Hide axis
    const axesGroup = scene.getObjectByName('dimensionAxes');
    axesGroup.children.forEach(arrow => {
      if (arrow.userData.dimension === dimension) {
        arrow.visible = false;
      }
    });
    
    // Hide dimension label
    const labels = document.getElementsByClassName('dimension-label');
    if (labels[dimension]) {
      labels[dimension].style.display = 'none';
    }
    
    // Hide slice control if dimension > 3
    if (dimension >= 3) {
      const sliceControl = document.querySelector(`.slice-control:nth-of-type(${dimension - 2})`);
      if (sliceControl) {
        sliceControl.style.display = 'none';
      }
    }
  }
  
  // Regenerate board
  updateBoardVisualization();
}

// Update slice visualization for higher dimensions
function updateSliceVisualization(dimension, value) {
  visualizationControls.sliceCoordinates[dimension] = value;
  updateBoardVisualization();
}

// Create dimensional particle effects
function createDimensionalParticles() {
  // Create particles for each active dimension above 3
  const numDimensions = activeDimensions.length;
  
  // Create a particle system for the multi-dimensional effect
  const particleCount = 3000;
  const particles = new THREE.BufferGeometry();
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  // Color selection based on active dimensions
  const colorOptions = DIMENSION_COLORS.map(color => new THREE.Color(color));
  
  // Create particles in a large cube surrounding the board
  for (let i = 0; i < particleCount; i++) {
    // Positions
    const x = (Math.random() - 0.5) * 100;
    const y = (Math.random() - 0.5) * 100 + 25; // Bias toward above the board
    const z = (Math.random() - 0.5) * 100;
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    // Colors - bias toward colors of higher dimensions
    let colorIndex;
    if (numDimensions > 3) {
      // Higher probability for higher dimension colors
      const dimensionBias = Math.random();
      if (dimensionBias > 0.6) {
        // Use higher dimension colors (if available)
        colorIndex = 3 + Math.floor(Math.random() * (numDimensions - 3));
      } else {
        // Use any dimension color
        colorIndex = Math.floor(Math.random() * numDimensions);
      }
    } else {
      colorIndex = Math.floor(Math.random() * colorOptions.length);
    }
    
    // Ensure colorIndex is within bounds
    colorIndex = Math.min(colorIndex, colorOptions.length - 1);
    
    const color = colorOptions[colorIndex];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });
  
  const particleSystem = new THREE.Points(particles, particleMaterial);
  particleSystem.name = 'dimensionalParticles';
  scene.add(particleSystem);
}

// Initialize the board with standard chess setup
function initializeBoard() {
  // Generate visible chunks of the board
  generateVisibleChunks();
  
  // Create pieces in starting positions
  createStandardChessPieces();
  
  // Add hyperpieces if more than 3 dimensions
  if (activeDimensions.length > 3) {
    createHyperpieces();
  }
}

// Generate chunks of the board visible to the camera
function generateVisibleChunks() {
  // Clear any previous board tiles
  for (const key in board) {
    scene.remove(board[key]);
    delete board[key];
  }
  
  // Get camera position in 3D space
  const cameraX = Math.floor(camera.position.x / TILE_SIZE);
  const cameraY = Math.floor(camera.position.y / TILE_SIZE);
  const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
  
  // Store for later chunk generation checks
  lastCameraPosition = { x: cameraX, y: cameraY, z: cameraZ };
  
  // Determine chunk coordinates for visible area
  const chunkX = Math.floor(cameraX / CHUNK_SIZE);
  const chunkY = Math.floor(cameraY / CHUNK_SIZE);
  const chunkZ = Math.floor(cameraZ / CHUNK_SIZE);
  
  // Generate chunks in visible range
  for (let cx = chunkX - 1; cx <= chunkX + 1; cx++) {
    for (let cy = chunkY - 1; cy <= chunkY + 1; cy++) {
      for (let cz = chunkZ - 1; cz <= chunkZ + 1; cz++) {
        generateChunk(cx, cy, cz);
      }
    }
  }
  
  // Update position display
  updatePositionDisplay();
}

// Generate a single chunk of tiles
function generateChunk(chunkX, chunkY, chunkZ) {
  const startX = chunkX * CHUNK_SIZE;
  const startY = chunkY * CHUNK_SIZE;
  const startZ = chunkZ * CHUNK_SIZE;
  
  // Only consider the currently visualized dimensions
  for (let x = startX; x < startX + CHUNK_SIZE; x++) {
    for (let z = startZ; z < startZ + CHUNK_SIZE; z++) {
      // Default higher dimensions to the current slice values
      const coords = Array(activeDimensions.length).fill(0);
      
      // Set the visualized dimensions
      coords[viewDimensions[0]] = x;
      coords[viewDimensions[1]] = z;
      
      // If we're showing 3D, use y for the third dimension
      if (viewDimensions.length > 2) {
        for (let y = startY; y < startY + CHUNK_SIZE; y++) {
          coords[viewDimensions[2]] = y;
          createTile(coords);
        }
      } else {
        // For higher dimensions, only create tiles at the current slice values
        for (let d = 0; d < activeDimensions.length; d++) {
          if (!viewDimensions.includes(d)) {
            coords[d] = visualizationControls.sliceCoordinates[d];
          }
        }
        createTile(coords);
      }
    }
  }
}

// Create a single tile at the specified coordinates
function createTile(coords) {
  const key = coords.join(',');
  
  // Skip if tile already exists
  if (board[key]) return;
  
  // Create tile geometry
  const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.2, TILE_SIZE);
  
  // Determine tile color (checkered pattern)
  let material;
  if (coords.reduce((sum, coord) => sum + coord, 0) % 2 === 0) {
    material = WHITE_MATERIAL;
  } else {
    material = BLACK_MATERIAL;
  }
  
  // Special case for origin (all zeros)
  if (coords.every(coord => coord === 0)) {
    material = ORIGIN_MATERIAL;
  }
  
  // Create tile mesh
  const tile = new THREE.Mesh(geometry, material);
  
  // Position the tile based on the visualized dimensions
  const position = new THREE.Vector3();
  
  // Map the coordinates to 3D space
  if (viewDimensions.length >= 1) position.x = coords[viewDimensions[0]] * TILE_SIZE;
  if (viewDimensions.length >= 2) position.z = coords[viewDimensions[1]] * TILE_SIZE;
  if (viewDimensions.length >= 3) position.y = coords[viewDimensions[2]] * TILE_SIZE;
  
  tile.position.copy(position);
  tile.receiveShadow = true;
  
  // Store the original coordinates for reference
  tile.userData.coords = [...coords];
  
  scene.add(tile);
  
  // Store the tile reference
  board[key] = tile;
}

// Create standard chess pieces (in a 2D plane)
function createStandardChessPieces() {
  // Define piece types for initial setup
  const backRank = [
    PIECE_TYPES.ROOK,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.QUEEN,
    PIECE_TYPES.KING,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.ROOK
  ];
  
  // Create pieces for both players
  for (let x = 0; x < 8; x++) {
    // Create coordinates for each piece
    // Black pieces at one end of the first dimension
    const blackBackRankCoords = Array(activeDimensions.length).fill(0);
    blackBackRankCoords[0] = x;
    blackBackRankCoords[1] = -7;
    
    const blackPawnCoords = Array(activeDimensions.length).fill(0);
    blackPawnCoords[0] = x;
    blackPawnCoords[1] = -6;
    
    // White pieces at the other end
    const whiteBackRankCoords = Array(activeDimensions.length).fill(0);
    whiteBackRankCoords[0] = x;
    whiteBackRankCoords[1] = 0;
    
    const whitePawnCoords = Array(activeDimensions.length).fill(0);
    whitePawnCoords[0] = x;
    whitePawnCoords[1] = -1;
    
    // Create pieces
    createPiece(blackBackRankCoords, backRank[x], PIECE_COLORS.BLACK);
    createPiece(blackPawnCoords, PIECE_TYPES.PAWN, PIECE_COLORS.BLACK);
    createPiece(whiteBackRankCoords, backRank[x], PIECE_COLORS.WHITE);
    createPiece(whitePawnCoords, PIECE_TYPES.PAWN, PIECE_COLORS.WHITE);
  }
}

// Create hyperpieces for higher dimensional play
function createHyperpieces() {
  // Only add hyperpieces in dimensions > 3
  if (activeDimensions.length <= 3) return;
  
  // Create hyperpieces for each player
  for (let i = 0; i < 2; i++) {
    const color = i === 0 ? PIECE_COLORS.WHITE : PIECE_COLORS.BLACK;
    
    // Position hyperpieces in higher dimensions
    // We'll place them at positions slightly offset in the higher dimensions
    
    // Example coordinates for hyperpieces - project them into higher dimensions
    const hyperRookCoords = Array(activeDimensions.length).fill(0);
    const hyperBishopCoords = Array(activeDimensions.length).fill(0);
    const hyperKnightCoords = Array(activeDimensions.length).fill(0);
    
    // Set positions (different for each color)
    hyperRookCoords[0] = 1; // X position
    hyperRookCoords[1] = i === 0 ? 1 : -8; // Z position
    hyperRookCoords[3] = 1; // 4th dimension offset
    
    hyperBishopCoords[0] = 2; // X position
    hyperBishopCoords[1] = i === 0 ? 1 : -8; // Z position
    hyperBishopCoords[3] = 1; // 4th dimension offset
    
    hyperKnightCoords[0] = 3; // X position
    hyperKnightCoords[1] = i === 0 ? 1 : -8; // Z position
    hyperKnightCoords[3] = 1; // 4th dimension offset
    
    // Create the hyperpieces
    createPiece(hyperRookCoords, PIECE_TYPES.HYPERROOK, color);
    createPiece(hyperBishopCoords, PIECE_TYPES.HYPERBISHOP, color);
    createPiece(hyperKnightCoords, PIECE_TYPES.HYPERKNIGHT, color);
  }
}

// Create a chess piece at specified coordinates
function createPiece(coords, type, color) {
  // Generate a unique key from the coordinates
  const key = coords.join(',');
  
  // Define piece geometry based on type
  let geometry, height;
  
  switch (type) {
    case PIECE_TYPES.PAWN:
      geometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12);
      height = 0.5;
      break;
    case PIECE_TYPES.ROOK:
      geometry = new THREE.BoxGeometry(0.3, 0.7, 0.3);
      height = 0.7;
      break;
    case PIECE_TYPES.KNIGHT:
      geometry = new THREE.ConeGeometry(0.2, 0.7, 8, 1, false, Math.PI/4);
      height = 0.7;
      break;
    case PIECE_TYPES.BISHOP:
      geometry = new THREE.ConeGeometry(0.2, 0.8, 16);
      height = 0.8;
      break;
    case PIECE_TYPES.QUEEN:
      geometry = new THREE.SphereGeometry(0.25, 16, 16);
      height = 0.9;
      break;
    case PIECE_TYPES.KING:
      geometry = new THREE.CylinderGeometry(0.25, 0.25, 1, 16);
      height = 1.0;
      break;
    case PIECE_TYPES.HYPERROOK:
      // More complex geometry for hyperrook
      geometry = new THREE.BoxGeometry(0.3, 0.7, 0.3);
      const edges = new THREE.EdgesGeometry(geometry);
      geometry = edges;
      height = 0.7;
      break;
    case PIECE_TYPES.HYPERBISHOP:
      // Multi-layered cone for hyperbishop
      geometry = new THREE.ConeGeometry(0.3, 0.9, 20);
      height = 0.9;
      break;
    case PIECE_TYPES.HYPERKNIGHT:
      // Special geometry for hyperknight
      geometry = new THREE.TetrahedronGeometry(0.3);
      height = 0.8;
      break;
    default:
      geometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
      height = 0.5;
  }
  
  // Create material based on color
  const material = new THREE.MeshStandardMaterial({
    color: color === PIECE_COLORS.WHITE ? 0xffffcc : 0x202020,
    metalness: 0.7,
    roughness: 0.2
  });
  
  // For hyperpieces, add some emissive and transparent properties
  if (type.startsWith('hyper')) {
    material.emissive = new THREE.Color(
      color === PIECE_COLORS.WHITE ? 0x333300 : 0x000033
    );
    material.transparent = true;
    material.opacity = 0.9;
  }
  
  // Create mesh
  const mesh = type.startsWith('hyper') && type !== PIECE_TYPES.HYPERROOK ? 
    new THREE.Mesh(geometry, material) : 
    type === PIECE_TYPES.HYPERROOK ? 
      new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffff00 })) :
      new THREE.Mesh(geometry, material);
  
  // Position the piece based on the visualized dimensions
  const position = new THREE.Vector3();
  
  // Map the coordinates to 3D space
  if (viewDimensions.length >= 1) position.x = coords[viewDimensions[0]] * TILE_SIZE;
  if (viewDimensions.length >= 2) position.z = coords[viewDimensions[1]] * TILE_SIZE;
  if (viewDimensions.length >= 3) position.y = coords[viewDimensions[2]] * TILE_SIZE;
  
  // Adjust height to sit on the board
  position.y += height / 2 + 0.2;
  
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Store the piece data
  pieces[key] = {
    mesh: mesh,
    type: type,
    color: color,
    coords: [...coords]
  };
  
  // Add to scene
  scene.add(mesh);
}

// Update the board visualization
function updateBoardVisualization() {
  // Clear current board
  for (const key in board) {
    scene.remove(board[key]);
  }
  
  // Clear pieces (temporarily)
  const piecesData = {};
  for (const key in pieces) {
    piecesData[key] = {
      type: pieces[key].type,
      color: pieces[key].color,
      coords: [...pieces[key].coords]
    };
    scene.remove(pieces[key].mesh);
  }
  
  // Clear the collections
  board = {};
  pieces = {};
  
  // Regenerate visible chunks
  generateVisibleChunks();
  
  // Restore pieces with updated visualization
  for (const key in piecesData) {
    const piece = piecesData[key];
    createPiece(piece.coords, piece.type, piece.color);
  }
}

// Update position display
function updatePositionDisplay() {
  if (positionDisplay) {
    const cameraX = Math.floor(camera.position.x / TILE_SIZE);
    const cameraY = Math.floor(camera.position.y / TILE_SIZE);
    const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
    
    // Create a coordinates array
    const coords = Array(activeDimensions.length).fill(0);
    
    // Map the 3D camera position to the active dimensions
    if (viewDimensions.length >= 1) coords[viewDimensions[0]] = cameraX;
    if (viewDimensions.length >= 2) coords[viewDimensions[1]] = cameraZ;
    if (viewDimensions.length >= 3) coords[viewDimensions[2]] = cameraY;
    
    // Format the coordinates as a tuple
    const tupleStr = `(${coords.join(', ')})`;
    
    // Update the display
    positionDisplay.textContent = `Position: ${tupleStr}`;
  }
}

// Check if new tiles need to be generated based on camera movement
function checkGenerateTiles() {
  const cameraX = Math.floor(camera.position.x / TILE_SIZE);
  const cameraY = Math.floor(camera.position.y / TILE_SIZE);
  const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
  
  // Calculate distance moved since last tile generation
  const distanceX = Math.abs(cameraX - lastCameraPosition.x);
  const distanceY = Math.abs(cameraY - lastCameraPosition.y);
  const distanceZ = Math.abs(cameraZ - lastCameraPosition.z);
  
  // If camera has moved enough, generate new tiles
  if (distanceX > LOAD_THRESHOLD || 
      distanceY > LOAD_THRESHOLD || 
      distanceZ > LOAD_THRESHOLD) {
    generateVisibleChunks();
    cleanupDistantTiles();
  }
  
  // Update position display on each frame
  updatePositionDisplay();
}

// Remove tiles that are too far from the camera
function cleanupDistantTiles() {
  const cameraX = Math.floor(camera.position.x / TILE_SIZE);
  const cameraY = Math.floor(camera.position.y / TILE_SIZE);
  const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
  const cleanupRange = VISIBLE_RANGE + 10; // Keep a buffer of tiles
  
  for (const key in board) {
    const coords = board[key].userData.coords;
    
    // Get visualized positions
    let x = 0, y = 0, z = 0;
    if (viewDimensions.length >= 1) x = coords[viewDimensions[0]];
    if (viewDimensions.length >= 2) z = coords[viewDimensions[1]];
    if (viewDimensions.length >= 3) y = coords[viewDimensions[2]];
    
    // Calculate distance from camera
    const distanceX = Math.abs(x - cameraX);
    const distanceY = Math.abs(y - cameraY);
    const distanceZ = Math.abs(z - cameraZ);
    
    // If tile is too far, remove it
    if (distanceX > cleanupRange || 
        distanceY > cleanupRange || 
        distanceZ > cleanupRange) {
      scene.remove(board[key]);
      delete board[key];
    }
  }
}

// Handle mouse click event
function onMouseClick(event) {
  // Prevent click from interfering with orbital controls
  event.preventDefault();
  
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Get objects intersected by the ray
  const intersects = raycaster.intersectObjects(scene.children, false);
  
  if (intersects.length > 0) {
    // Find which object was clicked (piece or tile)
    for (let i = 0; i < intersects.length; i++) {
      const object = intersects[i].object;
      
      // Check if a piece was clicked
      if (isPieceClicked(object)) {
        handlePieceClick(object);
        return;
      }
      
      // Check if a tile was clicked (and we have a selected piece)
      if (isTileClicked(object) && selectedPiece) {
        handleTileClick(object);
        return;
      }
    }
  }
  
  // If nothing relevant was clicked, deselect current piece
  deselectCurrentPiece();
}

// Check if clicked object is a chess piece
function isPieceClicked(object) {
  for (const key in pieces) {
    if (pieces[key].mesh === object) {
      return true;
    }
  }
  return false;
}

// Check if clicked object is a tile
function isTileClicked(object) {
  for (const key in board) {
    if (board[key] === object) {
      return true;
    }
  }
  return false;
}

// Handle click on a chess piece
function handlePieceClick(pieceObject) {
  // Find the piece data
  let pieceKey = null;
  for (const key in pieces) {
    if (pieces[key].mesh === pieceObject) {
      pieceKey = key;
      break;
    }
  }
  
  if (!pieceKey) return;
  
  const piece = pieces[pieceKey];
  
  // Check if it's this player's turn
  if (piece.color !== currentTurn) {
    console.log("Not your turn!");
    return;
  }
  
  // If we already had a piece selected, deselect it
  if (selectedPiece) {
    deselectCurrentPiece();
  }
  
  // Select this piece
  selectedPiece = {
    key: pieceKey,
    piece: piece,
    coords: [...piece.coords]
  };
  
  // Calculate valid moves for this piece
  calculateValidMoves();
  
  // Highlight the selected piece
  highlightSelectedPiece();
  
  // Highlight valid moves
  highlightValidMoves();
}

// Handle click on a tile
function handleTileClick(tileObject) {
  // Find the tile coordinates
  let tileKey = null;
  for (const key in board) {
    if (board[key] === tileObject) {
      tileKey = key;
      break;
    }
  }
  
  if (!tileKey) return;
  
  const coords = tileObject.userData.coords;
  
  // Check if this is a valid move
  const isValidMove = validMoves.some(move => move.join(',') === coords.join(','));
  
  if (isValidMove) {
    // Execute the move
    movePiece(selectedPiece, coords);
    
    // Deselect the piece and clean up highlights
    deselectCurrentPiece();
    
    // Switch turns
    switchTurn();
  } else {
    // Not a valid move, deselect
    deselectCurrentPiece();
  }
}

// Calculate valid moves for the selected piece
function calculateValidMoves() {
  validMoves = [];
  
  if (!selectedPiece) return;
  
  const { piece, coords } = selectedPiece;
  
  switch (piece.type) {
    case PIECE_TYPES.PAWN:
      calculatePawnMoves(coords, piece.color);
      break;
    case PIECE_TYPES.ROOK:
      calculateRookMoves(coords, piece.color);
      break;
    case PIECE_TYPES.KNIGHT:
      calculateKnightMoves(coords, piece.color);
      break;
    case PIECE_TYPES.BISHOP:
      calculateBishopMoves(coords, piece.color);
      break;
    case PIECE_TYPES.QUEEN:
      calculateQueenMoves(coords, piece.color);
      break;
    case PIECE_TYPES.KING:
      calculateKingMoves(coords, piece.color);
      break;
    case PIECE_TYPES.HYPERROOK:
      calculateHyperrookMoves(coords, piece.color);
      break;
    case PIECE_TYPES.HYPERBISHOP:
      calculateHyperbishopMoves(coords, piece.color);
      break;
    case PIECE_TYPES.HYPERKNIGHT:
      calculateHyperknightMoves(coords, piece.color);
      break;
  }
}

// Calculate valid pawn moves
function calculatePawnMoves(coords, color) {
  // Pawn direction depends on color (move along the second dimension - Z axis traditionally)
  const direction = color === PIECE_COLORS.WHITE ? -1 : 1;
  const forwardDimension = 1; // Second dimension (Z in classic chess)
  
  // Create new coordinates for forward move
  const forward = [...coords];
  forward[forwardDimension] += direction;
  
  if (!getPieceAt(forward)) {
    validMoves.push(forward);
    
    // Double move from starting position
    const startingRank = color === PIECE_COLORS.WHITE ? -1 : -6;
    if (coords[forwardDimension] === startingRank) {
      const doubleForward = [...coords];
      doubleForward[forwardDimension] += 2 * direction;
      if (!getPieceAt(doubleForward)) {
        validMoves.push(doubleForward);
      }
    }
  }
  
  // Capture moves (diagonally) - in first and second dimensions
  const captureLeft = [...coords];
  captureLeft[0] -= 1; // First dimension (X)
  captureLeft[forwardDimension] += direction;
  
  const captureRight = [...coords];
  captureRight[0] += 1; // First dimension (X)
  captureRight[forwardDimension] += direction;
  
  if (canCapture(captureLeft, color)) {
    validMoves.push(captureLeft);
  }
  
  if (canCapture(captureRight, color)) {
    validMoves.push(captureRight);
  }
}

// Calculate valid rook moves - moves along a single dimension
function calculateRookMoves(coords, color) {
  // For each dimension, check moves in both positive and negative directions
  for (let dim = 0; dim < activeDimensions.length; dim++) {
    // Skip dimensions that aren't being visualized if we're in a restricted view
    if (viewDimensions.length < 3 && !viewDimensions.includes(dim)) continue;
    
    // Calculate move range (with dimensional fatigue if enabled)
    const moveRange = dimensionalFatigue ? 
      Math.max(7 - (dim > 2 ? dim : 0), 2) : // More fatigue for higher dimensions
      7; // Standard range
    
    // Check positive direction
    for (let i = 1; i <= moveRange; i++) {
      const newCoords = [...coords];
      newCoords[dim] += i;
      
      const piece = getPieceAt(newCoords);
      
      if (!piece) {
        // Empty square, add to valid moves
        validMoves.push(newCoords);
      } else if (piece.color !== color) {
        // Enemy piece, add to valid moves and stop
        validMoves.push(newCoords);
        break;
      } else {
        // Friendly piece, stop
        break;
      }
    }
    
    // Check negative direction
    for (let i = 1; i <= moveRange; i++) {
      const newCoords = [...coords];
      newCoords[dim] -= i;
      
      const piece = getPieceAt(newCoords);
      
      if (!piece) {
        // Empty square, add to valid moves
        validMoves.push(newCoords);
      } else if (piece.color !== color) {
        // Enemy piece, add to valid moves and stop
        validMoves.push(newCoords);
        break;
      } else {
        // Friendly piece, stop
        break;
      }
    }
  }
}

// Calculate valid knight moves - L-shape movement (2 in one dimension, 1 in another)
function calculateKnightMoves(coords, color) {
  // For each pair of dimensions
  for (let dim1 = 0; dim1 < activeDimensions.length; dim1++) {
    for (let dim2 = 0; dim2 < activeDimensions.length; dim2++) {
      // Skip same dimension
      if (dim1 === dim2) continue;
      
      // Skip dimensions that aren't being visualized if we're in a restricted view
      if (viewDimensions.length < 3 && 
          (!viewDimensions.includes(dim1) || !viewDimensions.includes(dim2))) {
        continue;
      }
      
      // Generate all L-moves (2 in one dimension, 1 in another)
      for (let d1 of [-2, 2]) {
        for (let d2 of [-1, 1]) {
          // Move in first pattern (2 in dim1, 1 in dim2)
          const move1 = [...coords];
          move1[dim1] += d1;
          move1[dim2] += d2;
          
          // Move in second pattern (2 in dim2, 1 in dim1)
          const move2 = [...coords];
          move2[dim1] += d2;
          move2[dim2] += d1;
          
          // Check if the move is valid (empty or enemy piece)
          const piece1 = getPieceAt(move1);
          if (!piece1 || piece1.color !== color) {
            validMoves.push(move1);
          }
          
          const piece2 = getPieceAt(move2);
          if (!piece2 || piece2.color !== color) {
            validMoves.push(move2);
          }
        }
      }
    }
  }
}

// Calculate valid bishop moves - moves diagonally (equal steps in two or more dimensions)
function calculateBishopMoves(coords, color) {
  // For each pair of dimensions
  for (let dim1 = 0; dim1 < activeDimensions.length; dim1++) {
    for (let dim2 = dim1 + 1; dim2 < activeDimensions.length; dim2++) {
      // Skip dimensions that aren't being visualized if we're in a restricted view
      if (viewDimensions.length < 3 && 
          (!viewDimensions.includes(dim1) || !viewDimensions.includes(dim2))) {
        continue;
      }
      
      // Calculate move range (with dimensional fatigue if enabled)
      const moveRange = dimensionalFatigue ? 
        Math.max(7 - (Math.max(dim1, dim2) > 2 ? 1 : 0), 3) : // Slight fatigue
        7; // Standard range
      
      // Check all diagonal directions
      for (let d1 of [-1, 1]) {
        for (let d2 of [-1, 1]) {
          for (let i = 1; i <= moveRange; i++) {
            const newCoords = [...coords];
            newCoords[dim1] += d1 * i;
            newCoords[dim2] += d2 * i;
            
            const piece = getPieceAt(newCoords);
            
            if (!piece) {
              // Empty square, add to valid moves
              validMoves.push(newCoords);
            } else if (piece.color !== color) {
              // Enemy piece, add to valid moves and stop
              validMoves.push(newCoords);
              break;
            } else {
              // Friendly piece, stop
              break;
            }
          }
        }
      }
    }
  }
}

// Calculate valid queen moves (combination of rook and bishop)
function calculateQueenMoves(coords, color) {
  calculateRookMoves(coords, color);
  calculateBishopMoves(coords, color);
}

// Calculate valid king moves
function calculateKingMoves(coords, color) {
  // Generate all possible single-step moves in all active dimensions
  const moves = [];
  
  // Helper function to recursively generate moves
  function generateMoves(currentDim, currentMove) {
    if (currentDim >= activeDimensions.length) {
      // Skip if it's the original position
      if (currentMove.every((val, idx) => val === coords[idx])) {
        return;
      }
      moves.push([...currentMove]);
      return;
    }
    
    // Skip dimensions that aren't being visualized if we're in a restricted view
    if (viewDimensions.length < 3 && !viewDimensions.includes(currentDim)) {
      currentMove[currentDim] = coords[currentDim];
      generateMoves(currentDim + 1, currentMove);
      return;
    }
    
    // Try each possible value for this dimension
    for (let d of [-1, 0, 1]) {
      currentMove[currentDim] = coords[currentDim] + d;
      generateMoves(currentDim + 1, currentMove);
    }
  }
  
  // Start the recursive generation with an empty move
  const initialMove = Array(activeDimensions.length).fill(0);
  generateMoves(0, initialMove);
  
  // Filter out moves that lead to invalid positions or friendly pieces
  for (const move of moves) {
    const piece = getPieceAt(move);
    if (!piece || piece.color !== color) {
      validMoves.push(move);
    }
  }
}

// Calculate hyperrook moves - like rook but can move along multiple dimensions at once
function calculateHyperrookMoves(coords, color) {
  // First, include all standard rook moves
  calculateRookMoves(coords, color);
  
  // For hyperrook, allow movement along any number of dimensions simultaneously
  // but apply dimensional fatigue based on the number of dimensions used
  
  // Helper function to recursively generate multi-dimensional moves
  function generateMultiDimMoves(currentDim, dimsUsed, currentMove) {
    if (currentDim >= activeDimensions.length) {
      // Only add moves that use at least 2 dimensions
      if (dimsUsed >= 2) {
        // Apply dimensional fatigue if enabled
        const range = dimensionalFatigue ? 
          Math.max(7 - Math.pow(2, dimsUsed - 2), 2) : // Severe fatigue
          7 - dimsUsed; // Mild fatigue even if disabled
        
        // Generate moves with the calculated range
        generateMovesWithRange(currentMove, range);
      }
      return;
    }
    
    // Skip this dimension (don't use it in this move)
    generateMultiDimMoves(currentDim + 1, dimsUsed, [...currentMove, 0]);
    
    // Use this dimension in this move
    generateMultiDimMoves(currentDim + 1, dimsUsed + 1, [...currentMove, 1]);
  }
  
  // Generate moves with a given range
  function generateMovesWithRange(dimFlags, range) {
    for (let distance = 1; distance <= range; distance++) {
      // Generate all direction combinations
      generateDirections(0, dimFlags, distance, Array(dimFlags.length).fill(0));
    }
  }
  
  // Generate all direction combinations
  function generateDirections(currentDim, dimFlags, distance, directions) {
    if (currentDim >= dimFlags.length) {
      // Create and check the move
      const move = [...coords];
      let isMoveValid = false;
      
      for (let dim = 0; dim < activeDimensions.length; dim++) {
        if (dimFlags[dim] === 1) {
          move[dim] += directions[dim] * distance;
          isMoveValid = true;
        }
      }
      
      if (isMoveValid) {
        const piece = getPieceAt(move);
        if (!piece) {
          validMoves.push(move);
        } else if (piece.color !== color) {
          validMoves.push(move);
        }
      }
      
      return;
    }
    
    // Skip dimensions that aren't flagged for use
    if (dimFlags[currentDim] === 0) {
      directions[currentDim] = 0;
      generateDirections(currentDim + 1, dimFlags, distance, directions);
      return;
    }
    
    // Try both directions for this dimension
    directions[currentDim] = 1;
    generateDirections(currentDim + 1, dimFlags, distance, [...directions]);
    
    directions[currentDim] = -1;
    generateDirections(currentDim + 1, dimFlags, distance, [...directions]);
  }
  
  // Start the recursive generation with no dimensions used
  generateMultiDimMoves(0, 0, []);
}

// Calculate hyperbishop moves - enhanced bishop that can move in multiple dimension-pairs simultaneously
function calculateHyperbishopMoves(coords, color) {
  // First, include all standard bishop moves
  calculateBishopMoves(coords, color);
  
  // For hyperbishop, allow more complex diagonal movements
  // Hyperbishop can move along any 3 or more dimensions simultaneously in a diagonal pattern
  
  // Helper function to generate diagonal moves with more than 2 dimensions
  function generateHyperDiagonals(dimensions, distance) {
    if (dimensions.length < 3) return; // Need at least 3 dimensions
    
    // Generate all possible direction combinations for the selected dimensions
    const numDirections = Math.pow(2, dimensions.length);
    
    for (let dirIdx = 0; dirIdx < numDirections; dirIdx++) {
      const move = [...coords];
      let directionsUsed = 0;
      
      // Convert dirIdx to a binary direction pattern
      for (let i = 0; i < dimensions.length; i++) {
        const dim = dimensions[i];
        const direction = (dirIdx & (1 << i)) ? 1 : -1;
        move[dim] += direction * distance;
        directionsUsed++;
      }
      
      // Check if the move is valid
      const piece = getPieceAt(move);
      if (!piece) {
        validMoves.push(move);
      } else if (piece.color !== color) {
        validMoves.push(move);
      }
    }
  }
  
  // Generate all combinations of 3 or more dimensions to use
  function generateDimensionCombinations(start, current) {
    if (current.length >= 3) {
      // Calculate move range (with dimensional fatigue if enabled)
      const maxDim = Math.max(...current);
      const numDims = current.length;
      
      const moveRange = dimensionalFatigue ? 
        Math.max(7 - Math.pow(2, numDims - 3), 2) : // Severe fatigue
        7 - numDims + 2; // Mild fatigue even if disabled
      
      // Generate moves for each distance
      for (let distance = 1; distance <= moveRange; distance++) {
        generateHyperDiagonals(current, distance);
      }
    }
    
    // Keep adding more dimensions
    if (current.length < activeDimensions.length) {
      for (let i = start; i < activeDimensions.length; i++) {
        generateDimensionCombinations(i + 1, [...current, i]);
      }
    }
  }
  
  // Start the recursive generation with at least 3 dimensions
  if (activeDimensions.length >= 3) {
    generateDimensionCombinations(0, []);
  }
}

// Calculate hyperknight moves - enhanced knight with dimensional teleportation abilities
function calculateHyperknightMoves(coords, color) {
  // First, include all standard knight moves
  calculateKnightMoves(coords, color);
  
  // Hyperknight has special teleportation abilities in higher dimensions
  // It can jump 3 units in one dimension and 1 in two others
  
  // For each triplet of dimensions
  for (let dim1 = 0; dim1 < activeDimensions.length; dim1++) {
    for (let dim2 = 0; dim2 < activeDimensions.length; dim2++) {
      if (dim1 === dim2) continue;
      
      for (let dim3 = 0; dim3 < activeDimensions.length; dim3++) {
        if (dim1 === dim3 || dim2 === dim3) continue;
        
        // Generate all teleportation moves (3 in one dimension, 1 in two others)
        for (let d1 of [-3, 3]) {
          for (let d2 of [-1, 1]) {
            for (let d3 of [-1, 1]) {
              const move = [...coords];
              move[dim1] += d1;
              move[dim2] += d2;
              move[dim3] += d3;
              
              // Check if the move is valid (empty or enemy piece)
              const piece = getPieceAt(move);
              if (!piece || piece.color !== color) {
                validMoves.push(move);
              }
            }
          }
        }
      }
    }
  }
  
  // Additional teleportation ability - can move 2 units in each of two dimensions
  // and 1 unit in a third dimension
  for (let dim1 = 0; dim1 < activeDimensions.length; dim1++) {
    for (let dim2 = 0; dim2 < activeDimensions.length; dim2++) {
      if (dim1 === dim2) continue;
      
      for (let dim3 = 0; dim3 < activeDimensions.length; dim3++) {
        if (dim1 === dim3 || dim2 === dim3) continue;
        
        for (let d1 of [-2, 2]) {
          for (let d2 of [-2, 2]) {
            for (let d3 of [-1, 1]) {
              const move = [...coords];
              move[dim1] += d1;
              move[dim2] += d2;
              move[dim3] += d3;
              
              const piece = getPieceAt(move);
              if (!piece || piece.color !== color) {
                validMoves.push(move);
              }
            }
          }
        }
      }
    }
  }
}

// Get piece at specific coordinates
function getPieceAt(coords) {
  const key = coords.join(',');
  return pieces[key];
}

// Check if a position can be captured by the current color
function canCapture(coords, color) {
  const piece = getPieceAt(coords);
  return piece && piece.color !== color;
}

// Highlight the selected piece
function highlightSelectedPiece() {
  if (selectedPiece) {
    // Create a tile indicator below the selected piece
    const coords = selectedPiece.coords;
    const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
    const material = SELECTED_PIECE_MATERIAL;
    
    const highlight = new THREE.Mesh(geometry, material);
    
    // Position based on the visualized dimensions
    const position = new THREE.Vector3();
    
    // Map the coordinates to 3D space
    if (viewDimensions.length >= 1) position.x = coords[viewDimensions[0]] * TILE_SIZE;
    if (viewDimensions.length >= 2) position.z = coords[viewDimensions[1]] * TILE_SIZE;
    if (viewDimensions.length >= 3) position.y = coords[viewDimensions[2]] * TILE_SIZE;
    
    // Adjust height to be just above the board
    position.y = 0.15;
    
    highlight.position.copy(position);
    scene.add(highlight);
    
    // Store the highlight for later removal
    selectedPiece.highlight = highlight;
  }
}

// Highlight valid moves
function highlightValidMoves() {
  // Remove any existing move indicators
  clearValidMoveHighlights();
  
  // Create a new indicator for each valid move
  for (const moveCoords of validMoves) {
    // Determine if this is a capture move
    const isCapture = getPieceAt(moveCoords) !== undefined;
    
    // Create highlight geometry
    const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
    const material = isCapture ? CAPTURE_MOVE_MATERIAL : VALID_MOVE_MATERIAL;
    
    const highlight = new THREE.Mesh(geometry, material);
    
    // Position based on the visualized dimensions
    const position = new THREE.Vector3();
    
    // Map the coordinates to 3D space
    if (viewDimensions.length >= 1) position.x = moveCoords[viewDimensions[0]] * TILE_SIZE;
    if (viewDimensions.length >= 2) position.z = moveCoords[viewDimensions[1]] * TILE_SIZE;
    if (viewDimensions.length >= 3) position.y = moveCoords[viewDimensions[2]] * TILE_SIZE;
    
    // Adjust height to be just above the board
    position.y = 0.1;
    
    highlight.position.copy(position);
    scene.add(highlight);
    
    // Store the highlight for later removal
    moveHighlights.push(highlight);
  }
}

// Clear valid move highlights
function clearValidMoveHighlights() {
  for (const highlight of moveHighlights) {
    scene.remove(highlight);
  }
  moveHighlights = [];
}

// Deselect the current piece
function deselectCurrentPiece() {
  if (selectedPiece && selectedPiece.highlight) {
    scene.remove(selectedPiece.highlight);
  }
  
  clearValidMoveHighlights();
  selectedPiece = null;
  validMoves = [];
}

// Move a piece to a new position
function movePiece(selectedPiece, newCoords) {
  const { piece, coords, key } = selectedPiece;
  
  // Check if there's a piece to capture at the destination
  const newKey = newCoords.join(',');
  const capturedPiece = pieces[newKey];
  
  let isCapture = false;
  
  if (capturedPiece) {
    isCapture = true;
    
    // Remove the captured piece from the scene with an animation
    animatePieceCapture(capturedPiece.mesh);
    
    // Change the chessboard orientation randomly for dimensional effects
    changeChessboardOrientation();
    
    // Store the captured piece in the captured list
    capturedPieces[piece.color].push({
      type: capturedPiece.type,
      color: capturedPiece.color
    });
    
    // Update the UI with captured piece
    updateCapturedPiecesDisplay();
    
    // Remove from the pieces lookup
    delete pieces[newKey];
  }
  
  // Calculate new position based on the visualized dimensions
  const position = new THREE.Vector3();
  
  // Map the coordinates to 3D space
  if (viewDimensions.length >= 1) position.x = newCoords[viewDimensions[0]] * TILE_SIZE;
  if (viewDimensions.length >= 2) position.z = newCoords[viewDimensions[1]] * TILE_SIZE;
  if (viewDimensions.length >= 3) position.y = newCoords[viewDimensions[2]] * TILE_SIZE;
  
  // Get the original y position (height above board)
  const originalY = piece.mesh.position.y - (viewDimensions.length >= 3 ? newCoords[viewDimensions[2]] * TILE_SIZE : 0);
  
  // Animate the piece movement
  animatePieceMovement(piece.mesh, position.x, position.z, isCapture, originalY);
  
  // Play appropriate sound
  try {
    if (isCapture && captureSound) {
      captureSound.currentTime = 0;
      // Only play if user has interacted with the page
      if (document.hasFocus()) {
        const playPromise = captureSound.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log("Sound playback prevented by browser:", e);
            // Sound playback was prevented, we'll handle this silently
          });
        }
      }
    } else if (moveSound) {
      moveSound.currentTime = 0;
      // Only play if user has interacted with the page
      if (document.hasFocus()) {
        const playPromise = moveSound.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log("Sound playback prevented by browser:", e);
            // Sound playback was prevented, we'll handle this silently
          });
        }
      }
    }
  } catch (e) {
    console.log("Error handling sound playback:", e);
    // Silently fail if sound playback isn't working
  }
  
  // Update the piece's coordinates
  piece.coords = [...newCoords];
  
  // Update the pieces lookup
  delete pieces[key];
  pieces[newKey] = piece;
  
  // Create a multi-dimensional ripple effect
  createDimensionalRipple(
    coords[viewDimensions[0]] * TILE_SIZE, 
    coords[viewDimensions[1]] * TILE_SIZE, 
    newCoords[viewDimensions[0]] * TILE_SIZE, 
    newCoords[viewDimensions[1]] * TILE_SIZE, 
    isCapture
  );
}

// Animate piece movement
function animatePieceMovement(pieceMesh, targetX, targetZ, isCapture, originalY) {
  // Save original position
  const startX = pieceMesh.position.x;
  const startY = pieceMesh.position.y;
  const startZ = pieceMesh.position.z;
  
  // Create a multi-dimensional movement animation
  const duration = 500; // milliseconds
  const startTime = Date.now();
  
  // Jump height depends on move distance and capture status
  const moveDistance = Math.sqrt(
    Math.pow(targetX - startX, 2) + 
    Math.pow(targetZ - startZ, 2)
  );
  
  // Higher jump for captures, scaled by distance
  const jumpHeight = isCapture ? 
    2.0 + moveDistance * 0.2 : 
    1.0 + moveDistance * 0.1;
  
  function animateStep() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Ease in-out function for smooth movement
    const easeProgress = progress < 0.5 ? 
      2 * progress * progress : 
      1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Linear interpolation for x and z
    const currentX = startX + (targetX - startX) * easeProgress;
    const currentZ = startZ + (targetZ - startZ) * easeProgress;
    
    // Parabolic arc for y (height)
    // sin curve gives a nice up-and-down movement (0→1→0)
    const heightProgress = Math.sin(progress * Math.PI);
    const currentY = startY + jumpHeight * heightProgress;
    
    // Apply new position
    pieceMesh.position.set(currentX, currentY, currentZ);
    
    // Continue animation if not complete
    if (progress < 1.0) {
      requestAnimationFrame(animateStep);
    } else {
      // Ensure final position is exact
      pieceMesh.position.set(targetX, originalY, targetZ);
    }
  }
  
  // Start animation
  animateStep();
}

// Animate piece capture
function animatePieceCapture(pieceMesh) {
  // Original scale and position
  const originalScale = { x: pieceMesh.scale.x, y: pieceMesh.scale.y, z: pieceMesh.scale.z };
  const originalPosition = { x: pieceMesh.position.x, y: pieceMesh.position.y, z: pieceMesh.position.z };
  
  // Animation duration in milliseconds
  const duration = 400;
  const startTime = Date.now();
  
  function animateStep() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Scale down and fade
    const scale = 1 - progress;
    pieceMesh.scale.set(scale, scale, scale);
    
    // Spin and rise
    pieceMesh.rotation.y += 0.2;
    pieceMesh.position.y = originalPosition.y + progress * 2;
    
    // Continue animation if not complete
    if (progress < 1.0) {
      requestAnimationFrame(animateStep);
    } else {
      // Remove the piece from scene when animation completes
      scene.remove(pieceMesh);
    }
  }
  
  // Start animation
  animateStep();
}

// Create a dimensional ripple effect when pieces move
function createDimensionalRipple(startX, startZ, targetX, targetZ, isCapture) {
  // Create a ring geometry
  const geometry = new THREE.RingGeometry(0.4, 0.8, 32);
  const material = new THREE.MeshBasicMaterial({ 
    color: isCapture ? 0xff5500 : 0x00ffff,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  
  // Create one ring at start position and one at target position
  const startRing = new THREE.Mesh(geometry, material.clone());
  const targetRing = new THREE.Mesh(geometry, material.clone());
  
  // Position rings
  startRing.position.set(startX, 0.3, startZ);
  startRing.rotation.x = Math.PI / 2; // Lay flat
  
  targetRing.position.set(targetX, 0.3, targetZ);
  targetRing.rotation.x = Math.PI / 2; // Lay flat
  
  scene.add(startRing);
  scene.add(targetRing);
  
  // Animation duration
  const duration = 1000;
  const startTime = Date.now();
  
  function animateRings() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Expand rings and fade out
    const scale = 1 + progress * 3;
    const opacity = 1 - progress;
    
    startRing.scale.set(scale, scale, scale);
    targetRing.scale.set(scale, scale, scale);
    
    startRing.material.opacity = opacity;
    targetRing.material.opacity = opacity;
    
    if (progress < 1.0) {
      requestAnimationFrame(animateRings);
    } else {
      // Remove rings when animation completes
      scene.remove(startRing);
      scene.remove(targetRing);
    }
  }
  
  // Start animation
  animateRings();
}

// Change the orientation of the chessboard randomly
function changeChessboardOrientation() {
  // Create a parent container for the board if it doesn't exist
  if (!scene.getObjectByName('boardContainer')) {
    // Create a container for the board
    const boardContainer = new THREE.Group();
    boardContainer.name = 'boardContainer';
    
    // Move all chess tiles and pieces to the container
    const tilesToMove = [];
    const piecesToMove = [];
    
    // Collect all tiles and pieces
    scene.children.forEach(child => {
      // Check if it's a chess tile
      for (const key in board) {
        if (board[key] === child) {
          tilesToMove.push({ child, key });
          return;
        }
      }
      
      // Check if it's a chess piece
      for (const key in pieces) {
        if (pieces[key].mesh === child) {
          piecesToMove.push({ child, key });
          return;
        }
      }
    });
    
    // Move tiles to container
    tilesToMove.forEach(({ child, key }) => {
      const worldPos = child.position.clone();
      scene.remove(child);
      boardContainer.add(child);
      // Save the original position for future reference
      child.userData.originalPosition = worldPos.clone();
    });
    
    // Move pieces to container
    piecesToMove.forEach(({ child, key }) => {
      const worldPos = child.position.clone();
      scene.remove(child);
      boardContainer.add(child);
      // Save the original position for future reference
      child.userData.originalPosition = worldPos.clone();
    });
    
    // Add container to scene
    scene.add(boardContainer);
  }
  
  // Get the board container
  const boardContainer = scene.getObjectByName('boardContainer');
  
  // Get random rotation angles
  const possibleRotations = [
    { x: Math.PI, y: 0, z: 0 },          // Upside down
    { x: 0, y: Math.PI, z: 0 },          // 180 degrees around Y
    { x: 0, y: 0, z: Math.PI },          // 180 degrees around Z
    { x: Math.PI/2, y: 0, z: 0 },        // 90 degrees around X
    { x: 0, y: Math.PI/2, z: 0 },        // 90 degrees around Y
    { x: 0, y: 0, z: Math.PI/2 },        // 90 degrees around Z
    { x: Math.PI/4, y: Math.PI/4, z: 0 }, // 45 degrees on two axes
    { x: 0, y: 0, z: 0 }                  // Back to normal
  ];
  
  // Select a random rotation
  const newRotation = possibleRotations[Math.floor(Math.random() * possibleRotations.length)];
  
  // Animate the rotation
  const duration = 2000; // 2 seconds
  const startTime = Date.now();
  const startRotation = {
    x: boardContainer.rotation.x,
    y: boardContainer.rotation.y,
    z: boardContainer.rotation.z
  };
  
  // Create dimensional rift effect during rotation
  createDimensionalRift();
  
  function animateRotation() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Ease in-out function for smooth movement
    const easeProgress = progress < 0.5 ? 
      4 * progress * progress * progress : 
      1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Interpolate rotation
    boardContainer.rotation.x = startRotation.x + (newRotation.x - startRotation.x) * easeProgress;
    boardContainer.rotation.y = startRotation.y + (newRotation.y - startRotation.y) * easeProgress;
    boardContainer.rotation.z = startRotation.z + (newRotation.z - startRotation.z) * easeProgress;
    
    if (progress < 1.0) {
      requestAnimationFrame(animateRotation);
    }
  }
  
  // Start animation
  animateRotation();
}

// Create a dimensional rift effect during board rotation
function createDimensionalRift() {
  // Create a spherical effect at the center of the board
  const riftGeometry = new THREE.SphereGeometry(5, 32, 32);
  const riftMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    wireframe: true
  });
  
  const rift = new THREE.Mesh(riftGeometry, riftMaterial);
  rift.position.set(0, 5, 0);
  scene.add(rift);
  
  // Create lightning-like particle effects
  const lightningCount = 20;
  const lightnings = [];
  
  for (let i = 0; i < lightningCount; i++) {
    const points = [];
    const segmentCount = 10 + Math.floor(Math.random() * 10);
    
    // Create a lightning bolt (a series of connected points)
    let x = 0, y = 5, z = 0;
    const spread = 15;
    
    for (let j = 0; j < segmentCount; j++) {
      points.push(new THREE.Vector3(x, y, z));
      x += (Math.random() - 0.5) * spread / segmentCount;
      y += (Math.random() - 0.5) * spread / segmentCount;
      z += (Math.random() - 0.5) * spread / segmentCount;
    }
    
    const lightningGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lightningMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff, 
      linewidth: 2
    });
    
    const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
    scene.add(lightning);
    lightnings.push(lightning);
  }
  
  // Animate the rift and lightning
  const duration = 2000; // 2 seconds
  const startTime = Date.now();
  
  function animateRift() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Pulsate the rift
    const scale = 1 + 0.5 * Math.sin(progress * Math.PI * 4);
    rift.scale.set(scale, scale, scale);
    
    // Rotate the rift
    rift.rotation.x += 0.03;
    rift.rotation.y += 0.04;
    
    // Update lightning positions randomly
    lightnings.forEach(lightning => {
      lightning.rotation.x += (Math.random() - 0.5) * 0.2;
      lightning.rotation.y += (Math.random() - 0.5) * 0.2;
      lightning.rotation.z += (Math.random() - 0.5) * 0.2;
    });
    
    // Update opacity
    const fadeInOut = Math.sin(progress * Math.PI);
    rift.material.opacity = 0.5 * fadeInOut;
    lightnings.forEach(lightning => {
      lightning.material.opacity = fadeInOut;
    });
    
    if (progress < 1.0) {
      requestAnimationFrame(animateRift);
    } else {
      // Remove elements when animation is done
      scene.remove(rift);
      lightnings.forEach(lightning => scene.remove(lightning));
    }
  }
  
  // Start animation
  animateRift();
}

// Switch turns
function switchTurn() {
  currentTurn = currentTurn === PIECE_COLORS.WHITE ? PIECE_COLORS.BLACK : PIECE_COLORS.WHITE;
  updateGameStatus();
}

// Update game status display
function updateGameStatus() {
  if (gameStatusElement) {
    gameStatusElement.textContent = currentTurn === PIECE_COLORS.WHITE ? "White" : "Black";
    gameStatusElement.className = currentTurn === PIECE_COLORS.WHITE ? "badge bg-light text-dark" : "badge bg-dark";
  }
}

// Update captured pieces display
function updateCapturedPiecesDisplay() {
  const whiteCapturedElement = document.getElementById('white-captured');
  const blackCapturedElement = document.getElementById('black-captured');
  
  if (whiteCapturedElement && blackCapturedElement) {
    // Clear existing displays
    whiteCapturedElement.innerHTML = '';
    blackCapturedElement.innerHTML = '';
    
    // Helper function to get Unicode chess piece symbol
    const getPieceSymbol = (type, color) => {
      const symbols = {
        [PIECE_TYPES.PAWN]: color === PIECE_COLORS.WHITE ? '♙' : '♟',
        [PIECE_TYPES.ROOK]: color === PIECE_COLORS.WHITE ? '♖' : '♜',
        [PIECE_TYPES.KNIGHT]: color === PIECE_COLORS.WHITE ? '♘' : '♞',
        [PIECE_TYPES.BISHOP]: color === PIECE_COLORS.WHITE ? '♗' : '♝',
        [PIECE_TYPES.QUEEN]: color === PIECE_COLORS.WHITE ? '♕' : '♛',
        [PIECE_TYPES.KING]: color === PIECE_COLORS.WHITE ? '♔' : '♚',
        [PIECE_TYPES.HYPERROOK]: color === PIECE_COLORS.WHITE ? '♖+' : '♜+',
        [PIECE_TYPES.HYPERBISHOP]: color === PIECE_COLORS.WHITE ? '♗+' : '♝+',
        [PIECE_TYPES.HYPERKNIGHT]: color === PIECE_COLORS.WHITE ? '♘+' : '♞+'
      };
      return symbols[type] || '?';
    };
    
    // Add white captured pieces
    capturedPieces[PIECE_COLORS.WHITE].forEach(piece => {
      const pieceElement = document.createElement('span');
      pieceElement.className = 'captured-piece';
      pieceElement.textContent = getPieceSymbol(piece.type, piece.color);
      whiteCapturedElement.appendChild(pieceElement);
    });
    
    // Add black captured pieces
    capturedPieces[PIECE_COLORS.BLACK].forEach(piece => {
      const pieceElement = document.createElement('span');
      pieceElement.className = 'captured-piece';
      pieceElement.textContent = getPieceSymbol(piece.type, piece.color);
      blackCapturedElement.appendChild(pieceElement);
    });
  }
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.update();
  
  // Check if new tiles need to be generated
  checkGenerateTiles();
  
  // Animate dimensional particles if they exist
  animateDimensionalParticles();
  
  // Render the scene
  renderer.render(scene, camera);
}

// Animate dimensional particles
function animateDimensionalParticles() {
  const particles = scene.getObjectByName('dimensionalParticles');
  if (particles) {
    // Rotate the entire particle system slowly for a cosmic effect
    particles.rotation.y += 0.001;
    
    // Access the particle positions
    const positions = particles.geometry.attributes.position.array;
    
    // Update each particle position slightly
    for (let i = 0; i < positions.length; i += 3) {
      // Apply sine wave motion to create a flowing effect
      const time = Date.now() * 0.0005;
      
      // Add a small oscillation
      positions[i] += Math.sin(time + i * 0.01) * 0.03;
      positions[i + 1] += Math.cos(time + i * 0.02) * 0.02;
      positions[i + 2] += Math.sin(time + i * 0.015) * 0.03;
      
      // Check if particles have drifted too far and wrap them back
      const distanceSquared = 
        positions[i] * positions[i] + 
        positions[i + 1] * positions[i + 1] + 
        positions[i + 2] * positions[i + 2];
      
      if (distanceSquared > 10000) {
        // Reset to a random position closer to the center
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = (Math.random() - 0.5) * 100 + 25;
        positions[i + 2] = (Math.random() - 0.5) * 100;
      }
    }
    
    // Mark the attribute as needing an update
    particles.geometry.attributes.position.needsUpdate = true;
  }
}

// Export the init function to start the application
export { init };