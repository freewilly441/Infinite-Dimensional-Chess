/**
 * Infinite Chessboard Visualization
 * A procedurally generated infinite 3D chessboard using Three.js
 */

// Import Three.js and required components
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
const WHITE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
const BLACK_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x505050 });
const ORIGIN_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });

// Global variables
let scene, camera, renderer, controls;
let chessboard = {}; // Object to store generated tiles
let lastCameraPosition = { x: 0, z: 0 };
let positionDisplay;

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
  
  // Reference to HTML elements
  positionDisplay = document.getElementById('position-display');
  
  // Hide loading overlay
  document.getElementById('loading-overlay').style.display = 'none';
  
  // Event listeners
  window.addEventListener('resize', onWindowResize);
  
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

// Start the application
init();