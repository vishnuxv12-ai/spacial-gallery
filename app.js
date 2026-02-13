// --- SAVEPOINT 4 ---
const videoElement = document.getElementById('input_video');
const videoContainer = document.getElementById('video-container');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cursor = document.getElementById('hand-cursor');
// const uploadBtn = document.getElementById('upload-btn');
const splitToggle = document.getElementById('split-toggle');
const boundsToggle = document.getElementById('bounds-toggle');
const controlBounds = document.getElementById('control-bounds');
const radiusToggle = document.getElementById('radius-toggle');
const presentationToggle = document.getElementById('presentation-toggle');
const presentationControls = document.getElementById('presentation-controls');
const exitPresentationBtn = document.getElementById('exit-presentation');
const toggleCameraPresentationBtn = document.getElementById('toggle-camera-presentation');
const nightModeToggle = document.getElementById('night-mode-toggle');
const fileInput = document.getElementById('file-input');
const speedSlider = document.getElementById('speed-slider');
const colorMatchToggle = document.getElementById('color-match-toggle');
const IMAGE_WIDTH = 212.91;
const disclaimerPopup = document.getElementById('disclaimer-popup');
const disclaimerBtn = document.getElementById('disclaimer-cta');

// Panning and rotation state
let targetRotX = 0; // Pitch
let targetRotY = 0; // Yaw
// Zooming state
let posZ = 0;
let zoomVelocity = 0;

// Mouse Parallax
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;

let cursorX = 0.5;
let cursorY = 0.5;
let lastPinchDist = -1;
let cursorEnabled = true;
let baseRotY = -.02;
let baseRotX = 0;
let wasHandDetected = false;
let splitScreenEnabled = false;
let boundsVisible = false;
let radiusModeEnabled = false;
let presentationModeEnabled = false;
let nightModeEnabled = false;
let colorMatchEnabled = false;

// Disclaimer Logic
if (disclaimerBtn && disclaimerPopup) {
  // Force display on load to ensure it appears every session
  disclaimerPopup.style.display = 'flex';
  disclaimerPopup.style.opacity = '1';

  disclaimerBtn.addEventListener('click', () => {
    disclaimerPopup.style.opacity = '0';
    setTimeout(() => {
      disclaimerPopup.style.display = 'none';
    }, 500);
  });
}

// Toggle Logic
document.getElementById('cursor-toggle').addEventListener('click', () => {
  cursorEnabled = !cursorEnabled;
  if (!cursorEnabled) cursor.style.display = 'none';
});

splitToggle.addEventListener('click', () => {
  splitScreenEnabled = !splitScreenEnabled;
  splitToggle.innerText = splitScreenEnabled ? 'Split: ON' : 'Split: OFF';
  splitToggle.style.background = splitScreenEnabled ? 'white' : '#ddd';
});

boundsToggle.addEventListener('click', () => {
  boundsVisible = !boundsVisible;
  boundsToggle.innerText = boundsVisible ? 'Bounds: ON' : 'Bounds: OFF';
  boundsToggle.style.background = boundsVisible ? '#4CAF50' : '#ddd';
  boundsToggle.style.color = boundsVisible ? 'white' : 'black';
  controlBounds.style.display = boundsVisible ? 'block' : 'none';
  // Sync initial size
  controlBounds.style.width = (window.galleryParams.areaWidth * 100) + '%';
  controlBounds.style.height = (window.galleryParams.areaHeight * 100) + '%';
});

radiusToggle.addEventListener('click', () => {
  radiusModeEnabled = !radiusModeEnabled;
  radiusToggle.innerText = radiusModeEnabled ? 'Radius: ON' : 'Radius: OFF';
  radiusToggle.style.background = radiusModeEnabled ? '#4CAF50' : '#ddd';
  radiusToggle.style.color = radiusModeEnabled ? 'white' : 'black';
});

presentationToggle.addEventListener('click', () => {
  togglePresentationMode(true);
});

exitPresentationBtn.addEventListener('click', () => {
  togglePresentationMode(false);
});

toggleCameraPresentationBtn.addEventListener('click', () => {
  if (videoContainer.style.display === 'none') {
    videoContainer.style.display = 'block';
    toggleCameraPresentationBtn.style.background = 'rgba(76, 175, 80, 0.6)';
  } else {
    videoContainer.style.display = 'none';
    toggleCameraPresentationBtn.style.background = 'rgba(255, 255, 255, 0.2)';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && presentationModeEnabled) {
    togglePresentationMode(false);
  }
});

function togglePresentationMode(active) {
  presentationModeEnabled = active;
  const bento = document.getElementById('bento-container');
  const gui = document.querySelector('.lil-gui.root');

  if (active) {
    document.body.classList.add('presentation-mode');
    bento.style.display = 'none';
    if (gui) gui.style.display = 'none';
    cursor.style.display = 'none';
    controlBounds.style.display = 'none';
    if (videoContainer) videoContainer.style.display = 'none';
    presentationControls.style.display = 'flex';
    toggleCameraPresentationBtn.style.background = 'rgba(255, 255, 255, 0.2)';
  } else {
    document.body.classList.remove('presentation-mode');
    bento.style.display = 'grid';
    if (gui) gui.style.display = 'block';
    if (cursorEnabled) cursor.style.display = 'block';
    if (boundsVisible) controlBounds.style.display = 'block';
    if (videoContainer) videoContainer.style.display = 'block';
    presentationControls.style.display = 'none';
  }
}

nightModeToggle.addEventListener('click', () => {
  nightModeEnabled = !nightModeEnabled;
  document.body.classList.toggle('night-mode');
  nightModeToggle.innerText = nightModeEnabled ? 'Night Mode: ON' : 'Night Mode: OFF';
  nightModeToggle.style.background = nightModeEnabled ? '#333' : 'white';
  nightModeToggle.style.color = nightModeEnabled ? 'white' : 'black';
});

colorMatchToggle.addEventListener('click', async () => {
  colorMatchEnabled = !colorMatchEnabled;
  colorMatchToggle.innerText = colorMatchEnabled ? 'Processing...' : 'Color Match: OFF';
  colorMatchToggle.style.background = colorMatchEnabled ? '#4CAF50' : 'white';
  colorMatchToggle.style.color = colorMatchEnabled ? 'white' : 'black';

  if (colorMatchEnabled) {
    await toggleColorSort(true);
    colorMatchToggle.innerText = 'Color Match: ON';
  } else {
    toggleColorSort(false);
  }
});

document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// Sync Speed Slider with Global Params
speedSlider.addEventListener('input', (e) => {
  window.galleryParams.autoRotateSpeed = parseFloat(e.target.value);
});

// Upload Logic Removed (Replaced by Admin Interface)
// const uploadBtn = document.getElementById('upload-btn');
// ... legacy code removed ...

// 2. HAND TRACKING LOGIC
function onResults(results) {
  // Draw the video frame and hand rig
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  const handDetected = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
  if (handDetected) {
    const hand = results.multiHandLandmarks[0];

    // INDEX FINGER TIP (Point 8) and THUMB TIP (Point 4)
    const thumb = hand[4];
    const index = hand[8];

    // Draw hand rig: White lines, Black joints
    drawConnectors(canvasCtx, hand, HAND_CONNECTIONS, { color: '#FFFFFF', lineWidth: 2 });
    drawLandmarks(canvasCtx, hand, { color: '#000000', lineWidth: 1, radius: 3 });

    // Calculate midpoint between thumb and index for movement
    const midX = (thumb.x + index.x) / 2;
    const midY = (thumb.y + index.y) / 2;

    // CALC ZOOM: Distance between thumb and index
    const distance = Math.hypot(index.x - thumb.x, index.y - thumb.y);

    // Use pinch gesture to control zoom OR radius
    if (lastPinchDist > 0) {
      const delta = distance - lastPinchDist;
      if (radiusModeEnabled) {
        window.galleryParams.sphereRadius += delta * 2000;
        window.galleryParams.sphereRadius = Math.max(500, Math.min(3000, window.galleryParams.sphereRadius));
        window.updateGalleryRadius();
      } else {
        // Add momentum to zoom (Ease in/out)
        zoomVelocity += delta * 3000;
      }
    }
    lastPinchDist = distance;

    // CALC ROTATION: Use the pinch midpoint to rotate the scene
    // Split screen logic: Map left/right halves to full range
    let effectiveX;
    if (splitScreenEnabled) {
      effectiveX = midX < 0.5 ? midX * 2 : (midX - 0.5) * 2;
    } else {
      effectiveX = midX;
    }

    // Apply Control Area Scaling & Clamping
    // Normalize the input relative to the defined area
    let dx = (effectiveX - 0.5) / window.galleryParams.areaWidth;
    let dy = (midY - 0.5) / window.galleryParams.areaHeight;

    // Clamp to -0.5 to 0.5 (logical screen bounds)
    dx = Math.max(-0.5, Math.min(0.5, dx));
    dy = Math.max(-0.5, Math.min(0.5, dy));

    const handRotY = dx * -window.galleryParams.rotationSensitivity;
    const handRotX = dy * -window.galleryParams.rotationSensitivity;

    if (!wasHandDetected) {
      baseRotY = targetRotY - handRotY;
      baseRotX = targetRotX - handRotX;
    }
    targetRotY = baseRotY + handRotY;
    targetRotX = baseRotX + handRotX;

    // UPDATE CURSOR
    if (cursorEnabled && !presentationModeEnabled) {
      cursor.style.display = 'block';

      const targetCursorX = 1 - effectiveX;
      const targetCursorY = midY;
      cursorX += (targetCursorX - cursorX) * window.galleryParams.smoothingFactor;
      cursorY += (targetCursorY - cursorY) * window.galleryParams.smoothingFactor;

      cursor.style.left = (cursorX * 100) + '%';
      cursor.style.top = (cursorY * 100) + '%';
    }

    wasHandDetected = true;
  } else {
    lastPinchDist = -1;
    cursor.style.display = 'none';

    // Auto-rotate when no hand is detected
    wasHandDetected = false;

    if (window.galleryParams.autoRotateX) {
      targetRotX += window.galleryParams.autoRotateSpeed;
    }
    if (window.galleryParams.autoRotateY) {
      targetRotY += window.galleryParams.autoRotateSpeed;
    }
  }

  // --- UPDATE THREE.JS & GSAP ---

  // Apply Rotation (Convert degrees to radians)
  window.updateSphereRotation(THREE.MathUtils.degToRad(targetRotX), THREE.MathUtils.degToRad(targetRotY));

  // Audio: Update wind sound based on rotation speed
  if (audioInitialized) {
    // Estimate speed from GSAP target diff (simplified)
    // Ideally we'd track actual velocity, but checking target change is okay
    if (Math.abs(targetRotY) > 0.1 || Math.abs(targetRotX) > 0.1) {
      const now = Date.now();
      if (now - lastNoteTime > 200) {
        playNote();
        lastNoteTime = now;
      }
    }
  }

  // Mouse Parallax
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  // Apply Parallax to Camera
  camera.position.x = mouseX * 100;
  camera.position.y = mouseY * 100;
  camera.lookAt(0, 0, window.galleryParams.sphereCenterZ);

  if (handDetected) {
    zoomVelocity *= 0.94; // Friction
    posZ += zoomVelocity;
    posZ = Math.max(-1000, Math.min(2100, posZ)); // Clamp zoom
  } else {
    // Auto reset zoom if no hand
    posZ += (0 - posZ) * 0.1;
    zoomVelocity = 0;
  }

  // Apply Zoom via GSAP
  window.zoomTo(window.galleryParams.sphereCenterZ + posZ);

  // Visibility Logic (Clipping Front Hemisphere)
  const sphereCenterZ = mainGroup.position.z;
  mainGroup.updateMatrixWorld();

  const updateVisibility = (group) => {
    // Current Sphere Radius for adaptive fading
    const currentRadius = window.galleryParams.sphereRadius || 1320;
    const fadeDistance = currentRadius * 0.4; // Scale fade distance with radius

    group.children.forEach(child => {
      const element = child.element;

      if (element.classList.contains('particle-wrapper')) {
        child.lookAt(camera.position);
        child.updateMatrixWorld();
        const centerZ = child.matrixWorld.elements[14];
        const isVisible = centerZ < sphereCenterZ;
        element.style.opacity = isVisible ? 1 : 0;
        // Optimization: hide completely if not visible
        element.style.visibility = isVisible ? 'visible' : 'hidden';
        return;
      }

      if (element.classList.contains('image-item')) {
        child.lookAt(mainGroup.position);
        child.updateMatrixWorld();

        // Get world position elements after update
        const elements = child.matrixWorld.elements;
        const centerZ = elements[14];

        // --- VISIBILITY & CLIPPING ---
        // Replace complex clip-path with a smoother opacity fade to prevent visual glitches.
        // This also fixes a bug where position was read before the matrix was updated.
        // Images on the "front" hemisphere (between camera and sphere center) are faded out.

        const distanceToCenterPlane = centerZ - sphereCenterZ; // Positive when in front

        let opacity = 1.0;
        // Add slight hysteresis/offset to prevent flickering at the exact boundary
        if (distanceToCenterPlane > -50) {
          // Start fading slightly before the center plane to smooth the transition
          // Normalize fade based on reduced radius
          opacity = 1.0 - ((distanceToCenterPlane + 50) / fadeDistance);
        }

        opacity = Math.max(0, Math.min(1, opacity));

        // Performance: Use visibility hidden for fully transparent items
        if (opacity <= 0.01) {
          if (element.style.visibility !== 'hidden') element.style.visibility = 'hidden';
        } else {
          if (element.style.visibility !== 'visible') element.style.visibility = 'visible';
          element.style.opacity = opacity;
        }

        element.style.clipPath = 'none'; // Remove clipping to prevent glitches

        // --- MAGNETIC EFFECT ---
        // Scale up images that are close to the center of the view (XY plane)
        const baseScale = window.galleryParams.imageScale || 1.0;
        // Only apply costly sqrt if visible
        if (opacity > 0) {
          const distXY = Math.sqrt(elements[12] * elements[12] + elements[13] * elements[13]);
          let scale = baseScale;
          if (distXY < 350) { // 350px radius for magnetic effect
            scale = baseScale + (1 - distXY / 350) * 0.3; // Add magnetic boost
          }
          child.scale.set(scale, scale, scale);
        }
      }
    });
  };

  updateVisibility(sphereGroup);

  renderer.render(scene, camera);
  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const mpCamera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720
});
mpCamera.start();

// Start in Presentation Mode
togglePresentationMode(true);