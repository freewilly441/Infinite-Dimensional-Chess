/**
 * Infinite Chessboard Visualization
 * A procedurally generated infinite 3D chessboard using Three.js
 */

// Import Three.js and required components
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Check WebGL support
if (!window.WebGLRenderingContext) {
  document.getElementById('webgl-error').style.display = 'flex';
  document.getElementById('loading-overlay').style.display = 'none';
}

// Constants and configuration
const TILE_SIZE = 1.0;
const VISIBLE_RANGE = 30; // How many tiles to render in each direction
const LOAD_THRESHOLD = 5; // Load new tiles when camera moves this many units
const LIGHT_COLOR = 0xf0f0f0;
const DARK_COLOR = 0x505050;
const ORIGIN_COLOR = 0xff0000; // Red marker for origin
const VALID_MOVE_COLOR = 0x00ff00; // Green highlight for valid moves
const VALID_CAPTURE_COLOR = 0xff6600; // Orange highlight for valid captures
const SELECTED_PIECE_COLOR = 0x00ffff; // Cyan highlight for selected piece
const WHITE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
const BLACK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x505050 });
const ORIGIN_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
const VALID_MOVE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
const VALID_CAPTURE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 });
const SELECTED_PIECE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });

// Global variables
let scene, camera, renderer, controls;
let chessboard = {}; // Object to store generated tiles
let chessPieces = {}; // Object to store chess pieces
let pieceModels = {}; // Cache for loaded piece models
let lastCameraPosition = { x: 0, z: 0 };
let positionDisplay;
let pieceLoadingComplete = false;

// Game state variables
let selectedPiece = null; // Currently selected piece
let currentTurn = PIECE_COLORS.WHITE; // White moves first
let validMoves = []; // Valid moves for selected piece
let validMoveTiles = []; // References to highlighted valid move tiles
let gameStatusElement;
let capturedPieces = { 
  [PIECE_COLORS.WHITE]: [], 
  [PIECE_COLORS.BLACK]: [] 
};

// Define chess piece types and positions
const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

const PIECE_COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Standard chess starting position layout
const STANDARD_CHESS_LAYOUT = [
  // Black pieces (top row, z=-7)
  { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.BLACK, position: { x: 0, z: -7 } },
  { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.BLACK, position: { x: 1, z: -7 } },
  { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.BLACK, position: { x: 2, z: -7 } },
  { type: PIECE_TYPES.QUEEN, color: PIECE_COLORS.BLACK, position: { x: 3, z: -7 } },
  { type: PIECE_TYPES.KING, color: PIECE_COLORS.BLACK, position: { x: 4, z: -7 } },
  { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.BLACK, position: { x: 5, z: -7 } },
  { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.BLACK, position: { x: 6, z: -7 } },
  { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.BLACK, position: { x: 7, z: -7 } },
  
  // Black pawns (second row, z=-6)
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 0, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 1, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 2, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 3, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 4, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 5, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 6, z: -6 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.BLACK, position: { x: 7, z: -6 } },
  
  // White pawns (seventh row, z=-1)
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 0, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 1, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 2, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 3, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 4, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 5, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 6, z: -1 } },
  { type: PIECE_TYPES.PAWN, color: PIECE_COLORS.WHITE, position: { x: 7, z: -1 } },
  
  // White pieces (bottom row, z=0)
  { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.WHITE, position: { x: 0, z: 0 } },
  { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.WHITE, position: { x: 1, z: 0 } },
  { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.WHITE, position: { x: 2, z: 0 } },
  { type: PIECE_TYPES.QUEEN, color: PIECE_COLORS.WHITE, position: { x: 3, z: 0 } },
  { type: PIECE_TYPES.KING, color: PIECE_COLORS.WHITE, position: { x: 4, z: 0 } },
  { type: PIECE_TYPES.BISHOP, color: PIECE_COLORS.WHITE, position: { x: 5, z: 0 } },
  { type: PIECE_TYPES.KNIGHT, color: PIECE_COLORS.WHITE, position: { x: 6, z: 0 } },
  { type: PIECE_TYPES.ROOK, color: PIECE_COLORS.WHITE, position: { x: 7, z: 0 } }
];

// Initialize the scene
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
  controls.maxPolarAngle = Math.PI / 2;
  
  // Lighting setup
  setupLighting();
  
  // Create initial chessboard tiles
  generateVisibleTiles();
  
  // Add orientation axes
  addOrientationAxes();
  
  // Load chess pieces and place them on the board
  loadChessPieces();
  
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

// Create a single chess tile
function createTile(x, z) {
  const key = `${x},${z}`;
  
  // Skip if tile already exists
  if (chessboard[key]) return;
  
  // Create tile geometry
  const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.2, TILE_SIZE);
  
  // Determine tile color (checkered pattern)
  let material;
  if ((x + z) % 2 === 0) {
    material = WHITE_MATERIAL;
  } else {
    material = BLACK_MATERIAL;
  }
  
  // Special case for origin (0,0)
  if (x === 0 && z === 0) {
    material = ORIGIN_MATERIAL;
  }
  
  // Create tile mesh
  const tile = new THREE.Mesh(geometry, material);
  tile.position.set(x * TILE_SIZE, 0, z * TILE_SIZE);
  tile.receiveShadow = true;
  scene.add(tile);
  
  // Store the tile reference
  chessboard[key] = tile;
}

// Generate tiles within visible range of the camera
function generateVisibleTiles() {
  const cameraX = Math.floor(camera.position.x / TILE_SIZE);
  const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
  
  // Store current camera tile position
  lastCameraPosition = { x: cameraX, z: cameraZ };
  
  // Generate tiles in a square around the camera position
  for (let x = cameraX - VISIBLE_RANGE; x <= cameraX + VISIBLE_RANGE; x++) {
    for (let z = cameraZ - VISIBLE_RANGE; z <= cameraZ + VISIBLE_RANGE; z++) {
      createTile(x, z);
    }
  }
  
  // Update position display
  updatePositionDisplay(cameraX, cameraZ);
}

// Check if new tiles need to be generated based on camera movement
function checkGenerateTiles() {
  const cameraX = Math.floor(camera.position.x / TILE_SIZE);
  const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
  
  // Calculate how far the camera has moved since last tile generation
  const distanceX = Math.abs(cameraX - lastCameraPosition.x);
  const distanceZ = Math.abs(cameraZ - lastCameraPosition.z);
  
  // If camera has moved enough, generate new tiles
  if (distanceX > LOAD_THRESHOLD || distanceZ > LOAD_THRESHOLD) {
    generateVisibleTiles();
    cleanupDistantTiles();
  }
  
  // Update position display on each frame
  updatePositionDisplay(cameraX, cameraZ);
}

// Remove tiles that are too far from the camera
function cleanupDistantTiles() {
  const cameraX = Math.floor(camera.position.x / TILE_SIZE);
  const cameraZ = Math.floor(camera.position.z / TILE_SIZE);
  const cleanupRange = VISIBLE_RANGE + 10; // Keep a buffer of tiles
  
  for (const key in chessboard) {
    const [x, z] = key.split(',').map(Number);
    
    // Calculate distance from camera
    const distanceX = Math.abs(x - cameraX);
    const distanceZ = Math.abs(z - cameraZ);
    
    // If tile is too far, remove it
    if (distanceX > cleanupRange || distanceZ > cleanupRange) {
      scene.remove(chessboard[key]);
      delete chessboard[key];
    }
  }
}

// Add coordinate axes to help with orientation
function addOrientationAxes() {
  // X-axis (red)
  const xAxis = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0.1, 0),
    5,
    0xff0000,
    0.5,
    0.2
  );
  scene.add(xAxis);
  
  // Z-axis (blue)
  const zAxis = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0.1, 0),
    5,
    0x0000ff,
    0.5,
    0.2
  );
  scene.add(zAxis);
  
  // Y-axis (green)
  const yAxis = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    5,
    0x00ff00,
    0.5,
    0.2
  );
  scene.add(yAxis);
}

// Load and place chess pieces on the board
function loadChessPieces() {
  // Create basic piece geometries (temporary until models load)
  createBasicPieces();
  
  // Load 3D chess piece models
  loadChessPieceModels();
}

// Create simple geometric shapes for chess pieces (fallback/temporary)
function createBasicPieces() {
  // Define basic geometries and materials for each piece type
  const pieceDefs = {
    [PIECE_TYPES.PAWN]: {
      geometry: new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12),
      height: 0.5
    },
    [PIECE_TYPES.ROOK]: {
      geometry: new THREE.BoxGeometry(0.3, 0.7, 0.3),
      height: 0.7
    },
    [PIECE_TYPES.KNIGHT]: {
      geometry: new THREE.ConeGeometry(0.2, 0.7, 8, 1, false, Math.PI/4),
      height: 0.7
    },
    [PIECE_TYPES.BISHOP]: {
      geometry: new THREE.ConeGeometry(0.2, 0.8, 16),
      height: 0.8
    },
    [PIECE_TYPES.QUEEN]: {
      geometry: new THREE.SphereGeometry(0.25, 16, 16),
      height: 0.9
    },
    [PIECE_TYPES.KING]: {
      geometry: new THREE.CylinderGeometry(0.25, 0.25, 1, 16),
      height: 1.0
    }
  };
  
  // Create material for each color
  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffcc, 
    metalness: 0.7,
    roughness: 0.2
  });
  
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x202020, 
    metalness: 0.7,
    roughness: 0.3
  });
  
  // Place each piece according to the standard layout
  STANDARD_CHESS_LAYOUT.forEach(piece => {
    const pieceDef = pieceDefs[piece.type];
    const material = piece.color === PIECE_COLORS.WHITE ? whiteMaterial : blackMaterial;
    
    // Create mesh
    const mesh = new THREE.Mesh(pieceDef.geometry, material);
    
    // Position the piece
    const x = piece.position.x * TILE_SIZE + TILE_SIZE/2 - TILE_SIZE/2;
    const z = piece.position.z * TILE_SIZE + TILE_SIZE/2 - TILE_SIZE/2;
    const y = pieceDef.height / 2 + 0.2; // Half height + board thickness
    
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Store a reference to this piece
    const key = `${piece.position.x},${piece.position.z}`;
    chessPieces[key] = {
      mesh: mesh,
      type: piece.type,
      color: piece.color
    };
    
    // Add to scene
    scene.add(mesh);
  });
  
  pieceLoadingComplete = true;
}

// Load 3D models for chess pieces
function loadChessPieceModels() {
  // This would load actual 3D models for chess pieces
  // For now, we're using geometric primitives created in createBasicPieces
  // This function can be expanded later to load actual GLTF/GLB models
  
  // Example of how this would work with real models:
  /*
  const loader = new GLTFLoader();
  
  // Load each piece type
  const pieceTypes = [
    PIECE_TYPES.PAWN,
    PIECE_TYPES.ROOK,
    PIECE_TYPES.KNIGHT,
    PIECE_TYPES.BISHOP,
    PIECE_TYPES.QUEEN,
    PIECE_TYPES.KING
  ];
  
  // For each type, load both colors
  pieceTypes.forEach(type => {
    // Load white pieces
    loader.load(
      `/static/models/${type}_white.glb`,
      (gltf) => {
        pieceModels[`${type}_${PIECE_COLORS.WHITE}`] = gltf.scene;
        updatePiecesWithModels();
      },
      undefined,
      (error) => {
        console.error(`Error loading ${type} white:`, error);
      }
    );
    
    // Load black pieces
    loader.load(
      `/static/models/${type}_black.glb`,
      (gltf) => {
        pieceModels[`${type}_${PIECE_COLORS.BLACK}`] = gltf.scene;
        updatePiecesWithModels();
      },
      undefined,
      (error) => {
        console.error(`Error loading ${type} black:`, error);
      }
    );
  });
  */
}

// Update already placed pieces with loaded 3D models
function updatePiecesWithModels() {
  // This would replace the simple geometric pieces with loaded 3D models
  // For now, it's empty as we're using simple geometric pieces
  /*
  // Check if we have enough models loaded to update
  const requiredModels = STANDARD_CHESS_LAYOUT.length;
  const loadedModels = Object.keys(pieceModels).length;
  
  // Only proceed if all models are loaded
  if (loadedModels < requiredModels) return;
  
  // Update each piece with its corresponding model
  for (const key in chessPieces) {
    const piece = chessPieces[key];
    const modelKey = `${piece.type}_${piece.color}`;
    
    if (pieceModels[modelKey]) {
      // Remove old geometric piece
      scene.remove(piece.mesh);
      
      // Clone the model for this piece
      const model = pieceModels[modelKey].clone();
      
      // Position it at the same place
      model.position.copy(piece.mesh.position);
      
      // Add to scene
      scene.add(model);
      
      // Update reference
      piece.mesh = model;
    }
  }
  */
}

// Update position display in the UI
function updatePositionDisplay(x, z) {
  if (positionDisplay) {
    positionDisplay.textContent = `${x}, ${z}`;
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
  
  // Check if we need to generate new tiles
  checkGenerateTiles();
  
  // Render the scene
  renderer.render(scene, camera);
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
  for (const key in chessPieces) {
    if (chessPieces[key].mesh === object) {
      return true;
    }
  }
  return false;
}

// Check if clicked object is a tile
function isTileClicked(object) {
  for (const key in chessboard) {
    if (chessboard[key] === object) {
      return true;
    }
  }
  return false;
}

// Handle click on a chess piece
function handlePieceClick(pieceObject) {
  // Find the piece data
  let pieceKey = null;
  for (const key in chessPieces) {
    if (chessPieces[key].mesh === pieceObject) {
      pieceKey = key;
      break;
    }
  }
  
  if (!pieceKey) return;
  
  const piece = chessPieces[pieceKey];
  
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
    position: {
      x: parseInt(pieceKey.split(',')[0]),
      z: parseInt(pieceKey.split(',')[1])
    }
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
  for (const key in chessboard) {
    if (chessboard[key] === tileObject) {
      tileKey = key;
      break;
    }
  }
  
  if (!tileKey) return;
  
  const [x, z] = tileKey.split(',').map(Number);
  const moveKey = `${x},${z}`;
  
  // Check if this is a valid move
  const isValidMove = validMoves.some(move => `${move.x},${move.z}` === moveKey);
  
  if (isValidMove) {
    // Execute the move
    movePiece(selectedPiece, { x, z });
    
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
  
  const { piece, position } = selectedPiece;
  const { x, z } = position;
  
  switch (piece.type) {
    case PIECE_TYPES.PAWN:
      calculatePawnMoves(x, z, piece.color);
      break;
    case PIECE_TYPES.ROOK:
      calculateRookMoves(x, z, piece.color);
      break;
    case PIECE_TYPES.KNIGHT:
      calculateKnightMoves(x, z, piece.color);
      break;
    case PIECE_TYPES.BISHOP:
      calculateBishopMoves(x, z, piece.color);
      break;
    case PIECE_TYPES.QUEEN:
      calculateQueenMoves(x, z, piece.color);
      break;
    case PIECE_TYPES.KING:
      calculateKingMoves(x, z, piece.color);
      break;
  }
}

// Calculate valid pawn moves
function calculatePawnMoves(x, z, color) {
  // Pawn direction depends on color
  const direction = color === PIECE_COLORS.WHITE ? -1 : 1;
  
  // Forward move
  const forward = { x, z: z + direction };
  if (!getPieceAt(forward.x, forward.z)) {
    validMoves.push(forward);
    
    // Double move from starting position
    const startingRank = color === PIECE_COLORS.WHITE ? 0 : -6;
    if (z === startingRank) {
      const doubleForward = { x, z: z + 2 * direction };
      if (!getPieceAt(doubleForward.x, doubleForward.z)) {
        validMoves.push(doubleForward);
      }
    }
  }
  
  // Capture moves (diagonally)
  const captureLeft = { x: x - 1, z: z + direction };
  const captureRight = { x: x + 1, z: z + direction };
  
  if (canCapture(captureLeft.x, captureLeft.z, color)) {
    validMoves.push(captureLeft);
  }
  
  if (canCapture(captureRight.x, captureRight.z, color)) {
    validMoves.push(captureRight);
  }
}

// Calculate valid rook moves
function calculateRookMoves(x, z, color) {
  // Check each direction (up, down, left, right)
  const directions = [
    { x: 0, z: 1 },  // up
    { x: 0, z: -1 }, // down
    { x: -1, z: 0 }, // left
    { x: 1, z: 0 }   // right
  ];
  
  // For each direction, keep going until we hit a piece or the edge
  for (const dir of directions) {
    for (let i = 1; i <= 7; i++) {
      const newX = x + dir.x * i;
      const newZ = z + dir.z * i;
      
      const piece = getPieceAt(newX, newZ);
      
      if (!piece) {
        // Empty square, add to valid moves
        validMoves.push({ x: newX, z: newZ });
      } else if (piece.color !== color) {
        // Enemy piece, add to valid moves and stop
        validMoves.push({ x: newX, z: newZ });
        break;
      } else {
        // Friendly piece, stop
        break;
      }
    }
  }
}

// Calculate valid knight moves
function calculateKnightMoves(x, z, color) {
  // Knight moves in L-shape: 2 in one direction, 1 in perpendicular direction
  const moves = [
    { x: x + 2, z: z + 1 },
    { x: x + 2, z: z - 1 },
    { x: x - 2, z: z + 1 },
    { x: x - 2, z: z - 1 },
    { x: x + 1, z: z + 2 },
    { x: x - 1, z: z + 2 },
    { x: x + 1, z: z - 2 },
    { x: x - 1, z: z - 2 }
  ];
  
  // Check each potential move
  for (const move of moves) {
    const piece = getPieceAt(move.x, move.z);
    if (!piece || piece.color !== color) {
      validMoves.push(move);
    }
  }
}

// Calculate valid bishop moves
function calculateBishopMoves(x, z, color) {
  // Check each diagonal direction
  const directions = [
    { x: 1, z: 1 },   // up-right
    { x: 1, z: -1 },  // down-right
    { x: -1, z: 1 },  // up-left
    { x: -1, z: -1 }  // down-left
  ];
  
  // For each direction, keep going until we hit a piece or the edge
  for (const dir of directions) {
    for (let i = 1; i <= 7; i++) {
      const newX = x + dir.x * i;
      const newZ = z + dir.z * i;
      
      const piece = getPieceAt(newX, newZ);
      
      if (!piece) {
        // Empty square, add to valid moves
        validMoves.push({ x: newX, z: newZ });
      } else if (piece.color !== color) {
        // Enemy piece, add to valid moves and stop
        validMoves.push({ x: newX, z: newZ });
        break;
      } else {
        // Friendly piece, stop
        break;
      }
    }
  }
}

// Calculate valid queen moves (combination of rook and bishop)
function calculateQueenMoves(x, z, color) {
  calculateRookMoves(x, z, color);
  calculateBishopMoves(x, z, color);
}

// Calculate valid king moves
function calculateKingMoves(x, z, color) {
  // King moves one square in any direction
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dz === 0) continue; // Skip the current position
      
      const newX = x + dx;
      const newZ = z + dz;
      
      const piece = getPieceAt(newX, newZ);
      
      if (!piece || piece.color !== color) {
        validMoves.push({ x: newX, z: newZ });
      }
    }
  }
}

// Get piece at a specific position
function getPieceAt(x, z) {
  const key = `${x},${z}`;
  return chessPieces[key];
}

// Check if a position can be captured by current color
function canCapture(x, z, color) {
  const piece = getPieceAt(x, z);
  return piece && piece.color !== color;
}

// Highlight the selected piece
function highlightSelectedPiece() {
  if (selectedPiece) {
    // Create a tile indicator below the selected piece
    const { x, z } = selectedPiece.position;
    const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
    const material = SELECTED_PIECE_MATERIAL;
    
    const highlight = new THREE.Mesh(geometry, material);
    highlight.position.set(x * TILE_SIZE, 0.15, z * TILE_SIZE);
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
  for (const move of validMoves) {
    // Determine if this is a capture move
    const isCapture = !!getPieceAt(move.x, move.z);
    
    // Create a tile indicator
    const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
    const material = isCapture ? VALID_CAPTURE_MATERIAL : VALID_MOVE_MATERIAL;
    
    const highlight = new THREE.Mesh(geometry, material);
    highlight.position.set(move.x * TILE_SIZE, 0.15, move.z * TILE_SIZE);
    scene.add(highlight);
    
    // Store the highlight for later removal
    validMoveTiles.push(highlight);
  }
}

// Clear all valid move highlights
function clearValidMoveHighlights() {
  for (const highlight of validMoveTiles) {
    scene.remove(highlight);
  }
  validMoveTiles = [];
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
function movePiece(selectedPiece, newPosition) {
  const { piece, position, key } = selectedPiece;
  const { x: oldX, z: oldZ } = position;
  const { x: newX, z: newZ } = newPosition;
  
  // Check if there's a piece to capture at the destination
  const captureKey = `${newX},${newZ}`;
  const capturedPiece = chessPieces[captureKey];
  
  if (capturedPiece) {
    // Remove the captured piece from the scene
    scene.remove(capturedPiece.mesh);
    
    // Store the captured piece in the captured list
    capturedPieces[piece.color].push({
      type: capturedPiece.type,
      color: capturedPiece.color
    });
    
    // Update the UI with captured piece
    updateCapturedPiecesDisplay();
    
    // Remove from the chessPieces lookup
    delete chessPieces[captureKey];
  }
  
  // Calculate new position
  const newXPos = newX * TILE_SIZE + TILE_SIZE/2 - TILE_SIZE/2;
  const newZPos = newZ * TILE_SIZE + TILE_SIZE/2 - TILE_SIZE/2;
  
  // Move the piece mesh to the new position
  piece.mesh.position.x = newXPos;
  piece.mesh.position.z = newZPos;
  
  // Update the chessPieces lookup
  delete chessPieces[key];
  chessPieces[captureKey] = piece;
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
      };
      return symbols[type];
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

// Start the application
init();