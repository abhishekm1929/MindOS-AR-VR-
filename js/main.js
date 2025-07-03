// ar-tryon.js (or directly in a <script> tag in index.html after library imports)

// Global variables for Three.js scene (AR specific)
let scene, camera, renderer, productMesh;
let arModal = document.getElementById('ar-modal');
let closeArModalBtn = document.getElementById('close-ar-modal');
let loadingMessage = document.getElementById('loading-message');
let arCanvas = document.getElementById('ar-canvas'); // Renamed to avoid conflict with 'canvas' in general viewer
let arToolkitSource, arToolkitContext;
let markerRoot; // This will be the group where your 3D model is added
let animationFrameId; // To store the requestAnimationFrame ID for cleanup

// Keep track of the active product name for AR
let currentARProductName = '';

/**
 * Initiates the AR experience for a selected product.
 * @param {string} selectedProduct The name of the product to display in AR.
 */
function launchAR(selectedProduct) {
    currentARProductName = selectedProduct;
    arModal.style.display = 'flex';
    loadingMessage.style.display = 'block';
    arCanvas.style.display = 'none'; // Hide canvas until AR is ready

    // Initialize AR.js and Three.js for AR
    initAR();
}

// Event listener for closing the AR modal
if (closeArModalBtn) {
    closeArModalBtn.onclick = () => {
        arModal.style.display = 'none';
        // Clean up Three.js and AR.js resources when closing
        if (renderer) {
            renderer.dispose();
            renderer = null;
        }
        if (arToolkitSource) {
            arToolkitSource.stop(); // Stop webcam
            arToolkitSource = null;
        }
        if (arToolkitContext) {
            arToolkitContext = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Stop the animation loop
            animationFrameId = null;
        }
        // Clear the scene to prevent issues when reopening
        scene = null;
        camera = null;
        productMesh = null;
        markerRoot = null;

        // Remove any dynamically added video elements by AR.js
        const videoElement = document.querySelector('video');
        if (videoElement && videoElement.parentNode) {
            videoElement.parentNode.removeChild(videoElement);
        }
    };
}


/**
 * Initializes the AR.js source (webcam) and sets up the resize listener.
 */
function initAR() {
    scene = new THREE.Scene();

    // Set up AR.js source (webcam)
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
        // Optional: specify resolution if needed, but 'auto' is usually fine
        // sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
        // sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
    });

    arToolkitSource.init(() => {
        onARResize(); // Adjust video feed to canvas size after source is ready
        initThreeJSForAR(); // Initialize Three.js after webcam is ready
        // Hide loading message and show canvas
        loadingMessage.style.display = 'none';
        arCanvas.style.display = 'block';
    });

    // Handle window resize for AR
    window.addEventListener('resize', onARResize);
}

/**
 * Handles canvas resizing for the AR experience.
 */
function onARResize() {
    if (arToolkitSource && renderer && arToolkitContext && camera) {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) { // Check if arController is initialized
            arToolkitSource.copyElementSizeTo(arToolkitContext.domElement);
        }
        camera.aspect = renderer.domElement.width / renderer.domElement.height;
        camera.updateProjectionMatrix();
    }
}

/**
 * Initializes the Three.js scene, camera, renderer, and AR.js context for AR.
 * Loads the 3D model based on the currentARProductName.
 */
function initThreeJSForAR() {
    // Camera (AR.js handles its position/orientation)
    camera = new THREE.Camera();
    scene.add(camera);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: arCanvas,
        antialias: true,
        alpha: true // Important for transparency to see camera feed
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0); // Transparent background
    renderer.setSize(arCanvas.clientWidth, arCanvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // AR.js context
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'data/camera_para.dat', // Make sure this path is correct!
        detectionMode: 'mono',
        maxDetectionRate: 60,
        canvasForMatch: renderer.domElement // Use the same canvas for detection
    });

    arToolkitContext.init(() => {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // Marker Root - This is where your 3D object will be placed
    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    // Load a marker pattern (Hiro marker recommended for testing)
    const arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: 'data/patt.hiro', // Make sure this path is correct!
        changeMatrixMode: 'cameraTransformMatrix' // This makes the object appear to stay in place relative to the marker
    });

    // Add lights to the markerRoot so they move with the marker
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Increased intensity
    markerRoot.add(ambientLight);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1); // Increased intensity
    directionalLight1.position.set(1, 1, 1).normalize();
    markerRoot.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.7); // Increased intensity
    directionalLight2.position.set(-1, -1, -1).normalize();
    markerRoot.add(directionalLight2);


    // --- Product Model Creation based on currentARProductName ---
    let geometry;
    let material = new THREE.MeshPhongMaterial({ color: 0x007bff, specular: 0x555555, shininess: 30 }); // MindOS blue

    // Remove previous product mesh if it exists
    if (productMesh) {
        markerRoot.remove(productMesh);
        productMesh = null;
    }

    switch (currentARProductName) {
        case 'sunglasses':
            const sunglassesGroup = new THREE.Group();

            const frameThickness = 0.08;
            const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

            const frontFrameGeometry = new THREE.BoxGeometry(1.5, 0.3, frameThickness);
            const frontFrameMesh = new THREE.Mesh(frontFrameGeometry, frameMaterial);
            sunglassesGroup.add(frontFrameMesh);

            const bridgeGeometry = new THREE.BoxGeometry(0.2, 0.1, frameThickness);
            const bridgeMesh = new THREE.Mesh(bridgeGeometry, frameMaterial);
            bridgeMesh.position.z = frameThickness / 2;
            sunglassesGroup.add(bridgeMesh);

            const lensGeometry = new THREE.PlaneGeometry(0.6, 0.25);
            const lensMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });

            const lens1Mesh = new THREE.Mesh(lensGeometry, lensMaterial);
            lens1Mesh.position.set(-0.4, 0, frameThickness / 2 + 0.01);
            sunglassesGroup.add(lens1Mesh);

            const lens2Mesh = new THREE.Mesh(lensGeometry, lensMaterial);
            lens2Mesh.position.set(0.4, 0, frameThickness / 2 + 0.01);
            sunglassesGroup.add(lens2Mesh);

            const armShape = new THREE.Shape();
            armShape.moveTo(0, 0);
            armShape.lineTo(0.8, 0);
            armShape.lineTo(0.7, 0.05);
            armShape.lineTo(0, 0.05);
            armShape.lineTo(0, 0);

            const armExtrudeSettings = {
                steps: 1,
                depth: 0.05,
                bevelEnabled: true,
                bevelThickness: 0.01,
                bevelSize: 0.01,
                bevelOffset: 0,
                bevelSegments: 2
            };
            const armGeometry = new THREE.ExtrudeGeometry(armShape, armExtrudeSettings);
            const armMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

            const arm1 = new THREE.Mesh(armGeometry, armMaterial);
            arm1.position.set(-0.75, 0.05, -frameThickness / 2);
            arm1.rotation.y = Math.PI / 2;
            sunglassesGroup.add(arm1);

            const arm2 = new THREE.Mesh(armGeometry, armMaterial);
            arm2.position.set(0.75, 0.05, -frameThickness / 2);
            arm2.rotation.y = -Math.PI / 2;
            sunglassesGroup.add(arm2);

            productMesh = sunglassesGroup;
            break;

        case 'watch':
            const watchGroup = new THREE.Group();

            const watchBodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 64);
            const watchBodyMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            const watchBodyMesh = new THREE.Mesh(watchBodyGeometry, watchBodyMaterial);
            watchGroup.add(watchBodyMesh);

            const bezelGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 64);
            const bezelMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 80 });
            const bezelMesh = new THREE.Mesh(bezelGeometry, bezelMaterial);
            bezelMesh.position.y = watchBodyGeometry.parameters.height / 2 + bezelGeometry.parameters.height / 2;
            watchGroup.add(bezelMesh);

            const screenGeometry = new THREE.PlaneGeometry(0.7, 0.7);
            const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
            screenMesh.rotation.x = -Math.PI / 2;
            screenMesh.position.y = watchBodyGeometry.parameters.height / 2 + bezelGeometry.parameters.height + 0.01;
            watchGroup.add(screenMesh);

            const strapMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const strapProfile = new THREE.Shape();
            strapProfile.moveTo(0, 0);
            strapProfile.lineTo(0.08, 0);
            strapProfile.lineTo(0.08, 0.03);
            strapProfile.lineTo(0, 0.03);
            strapProfile.lineTo(0, 0);

            const strapExtrudeSettings = {
                steps: 1,
                depth: 0.8,
                bevelEnabled: false
            };

            const strapGeo = new THREE.ExtrudeGeometry(strapProfile, strapExtrudeSettings);

            const strap1Mesh = new THREE.Mesh(strapGeo, strapMaterial);
            strap1Mesh.rotation.y = Math.PI / 2;
            strap1Mesh.position.set(-0.4, -0.05, -0.4);
            watchGroup.add(strap1Mesh);

            const strap2Mesh = new THREE.Mesh(strapGeo, strapMaterial);
            strap2Mesh.rotation.y = Math.PI / 2;
            strap2Mesh.position.set(0.4, -0.05, -0.4);
            watchGroup.add(strap2Mesh);

            productMesh = watchGroup;
            break;

        case 'hat':
            const hatGroup = new THREE.Group();

            const crownGeometry = new THREE.SphereGeometry(0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
            const crownMaterial = new THREE.MeshPhongMaterial({ color: 0x663399 });
            const crownMesh = new THREE.Mesh(crownGeometry, crownMaterial);
            crownMesh.position.y = 0.3;
            hatGroup.add(crownMesh);

            const brimGeometry = new THREE.TorusGeometry(0.6, 0.15, 16, 100);
            const brimMaterial = new THREE.MeshPhongMaterial({ color: 0x442266 });
            const brimMesh = new THREE.Mesh(brimGeometry, brimMaterial);
            brimMesh.rotation.x = Math.PI / 2;
            brimMesh.position.y = -0.1;
            hatGroup.add(brimMesh);

            productMesh = hatGroup;
            break;

        case 'sofa':
            const sofaGroup = new THREE.Group();
            const sofaMaterial = new THREE.MeshPhongMaterial({ color: 0x996633 });

            const baseGeometry = new THREE.BoxGeometry(2.2, 0.4, 1);
            const baseMesh = new THREE.Mesh(baseGeometry, sofaMaterial);
            baseMesh.position.y = -0.2;
            sofaGroup.add(baseMesh);

            const backrestGeometry = new THREE.BoxGeometry(2.2, 0.9, 0.2);
            const backrestMesh = new THREE.Mesh(backrestGeometry, sofaMaterial);
            backrestMesh.position.set(0, 0.5, -0.4);
            backrestMesh.rotation.x = -0.1;
            sofaGroup.add(backrestMesh);

            const armrestGeometry = new THREE.BoxGeometry(0.25, 0.5, 1);
            const armrestMaterial = new THREE.MeshPhongMaterial({ color: 0x774422 });
            const armrest1 = new THREE.Mesh(armrestGeometry, armrestMaterial);
            armrest1.position.set(-1.05, 0.15, 0);
            sofaGroup.add(armrest1);

            const armrest2 = new THREE.Mesh(armrestGeometry, armrestMaterial);
            armrest2.position.set(1.05, 0.15, 0);
            sofaGroup.add(armrest2);

            const cushionGeometry = new THREE.BoxGeometry(0.9, 0.2, 0.9);
            const cushionMaterial = new THREE.MeshPhongMaterial({ color: 0xaa7744 });

            const cushion1 = new THREE.Mesh(cushionGeometry, cushionMaterial);
            cushion1.position.set(-0.5, 0.1, 0.1);
            sofaGroup.add(cushion1);

            const cushion2 = new THREE.Mesh(cushionGeometry, cushionMaterial);
            cushion2.position.set(0.5, 0.1, 0.1);
            sofaGroup.add(cushion2);

            productMesh = sofaGroup;
            break;

        case 'coffee-table':
            const tableGroup = new THREE.Group();

            const tableTopGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 64);
            const tableTopMaterial = new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.4,
                shininess: 100
            });
            const tableTopMesh = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
            tableTopMesh.position.y = 0.4;
            tableGroup.add(tableTopMesh);

            const legGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.8, 16);
            const legMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });

            const legPositions = [
                new THREE.Vector3(0.5, 0, 0.5),
                new THREE.Vector3(-0.5, 0, 0.5),
                new THREE.Vector3(0.5, 0, -0.5),
                new THREE.Vector3(-0.5, 0, -0.5)
            ];

            legPositions.forEach(pos => {
                const legMesh = new THREE.Mesh(legGeometry, legMaterial);
                legMesh.position.copy(pos);
                legMesh.position.y = -0.05;
                tableGroup.add(legMesh);
            });

            productMesh = tableGroup;
            break;

        case 'lamp':
            const lampGroup = new THREE.Group();

            const lampBaseGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 32);
            const lampBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 50 });
            const lampBaseMesh = new THREE.Mesh(lampBaseGeometry, lampBaseMaterial);
            lampBaseMesh.position.y = lampBaseGeometry.parameters.height / 2;
            lampGroup.add(lampBaseMesh);

            const lampPoleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 16);
            const lampPoleMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
            const poleMesh = new THREE.Mesh(lampPoleGeometry, lampPoleMaterial);
            poleMesh.position.y = lampBaseGeometry.parameters.height + lampPoleGeometry.parameters.height / 2;
            lampGroup.add(poleMesh);

            const lampShadeGeometry = new THREE.ConeGeometry(0.4, 0.6, 32, 1, true);
            const lampShadeMaterial = new THREE.MeshPhongMaterial({
                color: 0xffcc88,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const shadeMesh = new THREE.Mesh(lampShadeGeometry, lampShadeMaterial);
            shadeMesh.position.y = lampBaseGeometry.parameters.height + lampPoleGeometry.parameters.height + lampShadeGeometry.parameters.height / 2;
            lampGroup.add(shadeMesh);

            const lightBulb = new THREE.PointLight(0xffeedd, 1, 5);
            lightBulb.position.y = shadeMesh.position.y + 0.1;
            lampGroup.add(lightBulb);

            productMesh = lampGroup;
            break;

        default:
            // Fallback for unknown products or generic placeholder
            geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            productMesh = new THREE.Mesh(geometry, material);
            break;
    }

    if (productMesh) {
        // Adjust scale for AR (models might be too big or too small depending on real-world marker size)
        // You will likely need to tweak these scales significantly for each model
        let scaleFactor = 0.2; // Default scale factor
        if (currentARProductName === 'sofa') {
            scaleFactor = 0.05; // Sofa might need to be much smaller
        } else if (currentARProductName === 'coffee-table' || currentARProductName === 'lamp') {
            scaleFactor = 0.1; // Furniture often needs smaller scale
        }
        productMesh.scale.set(scaleFactor, scaleFactor, scaleFactor); 
        
        // Position adjustment for some models relative to the marker's center
        // This attempts to make the base of the model appear on the marker
        if (currentARProductName === 'sofa') {
            productMesh.position.y = -0.5 * scaleFactor; // Adjust based on height of sofa
        } else if (currentARProductName === 'coffee-table') {
            productMesh.position.y = -0.3 * scaleFactor; // Adjust based on height of table
        } else if (currentARProductName === 'lamp') {
            productMesh.position.y = -0.8 * scaleFactor; // Adjust based on height of lamp
        } else if (currentARProductName === 'watch') {
            productMesh.position.y = -0.05 * scaleFactor; // Adjust for watch
        } else if (currentARProductName === 'sunglasses') {
            productMesh.position.y = -0.05 * scaleFactor; // Adjust for sunglasses
        } else if (currentARProductName === 'hat') {
            productMesh.position.y = -0.1 * scaleFactor; // Adjust for hat
        }


        markerRoot.add(productMesh); // Add product to the markerRoot
    }

   function animateAR() {
    requestAnimationFrame(animateAR);

    if (arToolkitSource && arToolkitSource.ready && arToolkitContext) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Start the animation loop
animateAR();
}