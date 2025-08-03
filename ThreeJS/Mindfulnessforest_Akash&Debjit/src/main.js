import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'; // *** CORRECTED SYNTAX HERE ***
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// ======== Global Variables ========
let scene, camera, renderer, clock, controls, sky, sun;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let sunLight;
let natureSound; // Ambient nature sound
let waterfallSound; // For the 3D positional audio
let waterfallSoundSource; // An invisible mesh to attach the waterfall sound to

// --- Day/Night Cycle Variables ---
let isDay = true;
let timeOfDay = 1;

// --- Rain Variables ---
let rainParticles;
let rainSound;
let isRaining = false; // State for toggling rain
const rainDropCount = 50000; // Number of raindrops (adjust for performance/density)
const rainAreaSize = 250; // Size of the cube area where rain falls
const rainSpeed = 100; // How fast rain falls (units per second)

// --- Mindfulness Quotes Variables ---
let mindfulnessQuotes = [
    "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    "Breathe in calm, breathe out worry.",
    "Every moment is a fresh beginning.",
    "Happiness is not something ready-made. It comes from your own actions.",
    "Let your mind be still, and you will hear the universe whisper.",
    "The less you open your heart to others, the more your heart suffers.",
    "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
    "Peace comes from within. Do not seek it without."
];
let quoteDisplay, quoteText;

// --- Collider Variables (not active for player physics in this version) ---
let raycaster;
let collidableObjects = [];
const playerHeight = 1.8;
const collisionCheckDistance = 0.6;

// ======== Main Initialization ========
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    clock = new THREE.Clock();

    // --- Renderer ---
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    document.body.appendChild(renderer.domElement);

    // --- Procedural Sky ---
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 2;
    skyUniforms['rayleigh'].value = 1;
    skyUniforms['mieCoefficient'].value = 0.001;
    skyUniforms['mieDirectionalG'].value = 0.7;

    const fixedElevation = 30;
    const fixedAzimuth = 180;
    const phi = THREE.MathUtils.degToRad(90 - fixedElevation);
    const theta = THREE.MathUtils.degToRad(fixedAzimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sun);

    // --- Atmospheric Fog ---
    const fogColor = new THREE.Color(0xC0C0C0);
    scene.fog = new THREE.Fog(fogColor, 15, 80);
    renderer.setClearColor(scene.fog.color);

    // --- Final Lighting Setup ---
    sunLight = new THREE.DirectionalLight(0xFFCF94, 2.0);
    sunLight.position.copy(sun).multiplyScalar(100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    scene.add(new THREE.HemisphereLight(0xB0E0E6, 0x696969, 1.2));

    // --- Camera Start Position ---
    camera.position.set(0, 2.5, 12);
    camera.updateProjectionMatrix();

    // --- Initialize controls and load assets ---
    controls = setupControls(camera);
    loadAssets(controls);

    quoteDisplay = document.getElementById('quoteDisplay');
    quoteText = document.getElementById('quoteText');

    raycaster = new THREE.Raycaster();

    window.addEventListener('resize', onWindowResize);
}

// ======== Asset Loading ========
function loadAssets(controls) {
    const loader = new GLTFLoader();
    const listener = new THREE.AudioListener();
    camera.add(listener);

    console.log("DEBUG AudioListener context state (initial):", listener.context.state);


    // Load the main forest GLB model
    loader.load('/models/forest.glb', gltf => {
        if (gltf.scene) {
            scene.add(gltf.scene);

            gltf.scene.position.set(0, -0.5, 0);
            gltf.scene.scale.setScalar(1);

            gltf.scene.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material && child.material.name === 'water') {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x4682B4,
                            roughness: 0.2,
                            metalness: 0.8,
                            transparent: true,
                            opacity: 0.7,
                        });
                        child.material.side = THREE.DoubleSide;
                    }
                    if (child.material && (child.material.name === 'fire' || child.material.name === 'Flame')) {
                        child.material.emissive = new THREE.Color(0xFF8C00);
                        child.material.emissiveIntensity = 2.0;
                        child.material.needsUpdate = true;
                    }
                }
            });
            console.log("Forest.glb loaded with integrated campfire and improved visuals.");
            setupRain(listener);
            setupWaterfallSound(listener);
        } else {
            console.error('CRITICAL: gltf.scene is undefined for forest.glb. Model loading failed.');
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.backgroundColor = 'red';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.zIndex = '1000';
            errorDiv.textContent = 'CRITICAL ERROR: Forest model failed to load. Check console for details!';
            document.body.appendChild(errorDiv);
        }
    },
        undefined,
        (error) => {
            console.error('CRITICAL: Error loading forest.glb. Check file path and integrity:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.backgroundColor = 'red';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.zIndex = '1000';
            errorDiv.textContent = 'CRITICAL ERROR: Forest model failed to load. Check console for details!';
            document.body.appendChild(errorDiv);
        });

    const audioLoader = new THREE.AudioLoader();

    natureSound = new THREE.Audio(listener);
    audioLoader.load('/sounds/nature_sound.mp3', buffer => {
        natureSound.setBuffer(buffer);
        natureSound.setLoop(true);
        natureSound.setVolume(0.4);
    }, undefined, (error) => console.error('Error loading nature_sound.mp3:', error));

    controls.addEventListener('lock', () => {
        // Nature sound will be played in the initial click handler now.
    });
}

// ======== Rain Setup ========
function setupRain(listener) {
    const rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainDropCount * 3);

    for (let i = 0; i < rainDropCount; i++) {
        positions[i * 3] = (Math.random() * rainAreaSize) - (rainAreaSize / 2);
        positions[i * 3 + 1] = (Math.random() * rainAreaSize) - (rainAreaSize / 2) + camera.position.y + 50;
        positions[i * 3 + 2] = (Math.random() * rainAreaSize) - (rainAreaSize / 2);
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMaterial = new THREE.PointsMaterial({
        color: 0xAAAAAA,
        size: 0.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rainParticles);
    rainParticles.visible = false;

    const audioLoader = new THREE.AudioLoader();
    rainSound = new THREE.Audio(listener);
    audioLoader.load('/sounds/rain_sound.mp3', buffer => {
        rainSound.setBuffer(buffer);
        rainSound.setLoop(true);
        rainSound.setVolume(0.6);
    }, undefined, (error) => console.error('Error loading rain_sound.mp3:', error));

    console.log("Rain system and sound initialized. Press 'R' to toggle.");
}

// ======== Waterfall Positional Audio Setup ========
function setupWaterfallSound(listener) {
    const waterfallX = -28.487;
    const waterfallY = 2.5;
    const waterfallZ = -1.496;

    waterfallSoundSource = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    waterfallSoundSource.position.set(waterfallX, waterfallY, waterfallZ);
    scene.add(waterfallSoundSource);

    waterfallSound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('/sounds/water_sound.mp3', buffer => {
        waterfallSound.setBuffer(buffer);
        waterfallSound.setLoop(true);
        waterfallSound.setVolume(1.0);

        waterfallSound.setRefDistance(10); // Adjusted for aggressive falloff
        waterfallSound.setMaxDistance(80); // Adjusted for aggressive falloff
        waterfallSound.setDistanceModel('inverse');

        waterfallSoundSource.add(waterfallSound);

        console.log("DEBUG: Waterfall audio buffer loaded and attached to source.");
        console.log("DEBUG Waterfall Sound initial volume (PositionalAudio):", waterfallSound.getVolume());
        console.log("DEBUG Waterfall Sound isPlaying (after load):", waterfallSound.isPlaying);
    }, undefined, (error) => {
        console.error(`CRITICAL AUDIO ERROR: Failed to load water_sound.mp3 for positional audio: ${error}`);
        console.log("DEBUG: Please verify 'public/sounds/water_sound.mp3' exists and is a valid MP3 file.");
    });

    console.log(`Waterfall sound source precisely placed at X:${waterfallX}, Y:${waterfallY}, Z:${waterfallZ}.`);
}


// ======== Interactive Features ========

function displayRandomQuote() {
    if (!quoteDisplay || !quoteText) return;

    const randomIndex = Math.floor(Math.random() * mindfulnessQuotes.length);
    const quote = mindfulnessQuotes[randomIndex];

    quoteText.textContent = quote;
    quoteDisplay.classList.add('show');
    quoteDisplay.style.visibility = 'visible';

    setTimeout(() => {
        quoteDisplay.classList.remove('show');
        setTimeout(() => {
            quoteDisplay.style.visibility = 'hidden';
        }, 1500);
    }, 5000);
}


// ======== Controls Setup ========
function setupControls(camera) {
    const newControls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', () => {
        newControls.lock();
        console.log("Player position on lock:", newControls.getObject().position);

        const listener = camera.children.find(child => child instanceof THREE.AudioListener);

        if (listener && listener.context.state === 'suspended') {
            listener.context.resume().then(() => {
                console.log("DEBUG: AudioContext resumed successfully.");
                if (natureSound && !natureSound.isPlaying) {
                    natureSound.play();
                    console.log("DEBUG: Nature sound played on initial click (after resume).");
                }
                if (waterfallSound && !waterfallSound.isPlaying) {
                    waterfallSound.play();
                    console.log("DEBUG: Waterfall sound played on initial click (after resume).");
                }
            }).catch(e => console.error("Error resuming AudioContext:", e));
        } else {
            console.log("DEBUG: AudioContext state already running or not yet loaded:", listener ? listener.context.state : "Listener not ready.");
            if (natureSound && !natureSound.isPlaying) natureSound.play();
            if (waterfallSound && !waterfallSound.isPlaying) waterfallSound.play();
        }
    });

    newControls.addEventListener('lock', () => {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    newControls.addEventListener('unlock', () => {
        blocker.style.display = 'flex';
        instructions.style.display = '';
        if (natureSound && natureSound.isPlaying) natureSound.pause();
        if (waterfallSound && waterfallSound.isPlaying) waterfallSound.pause();
        if (rainSound && rainSound.isPlaying) rainSound.pause();
    });

    scene.add(newControls.getObject());

    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': moveForward = true; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
            case 'KeyS': case 'ArrowDown': moveBackward = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'KeyQ': displayRandomQuote(); break;
            case 'KeyN': isDay = !isDay; break; // Toggle Day/Night
            case 'KeyR': // Toggle Rain
                isRaining = !isRaining;
                if (rainParticles) {
                    rainParticles.visible = isRaining;
                }
                if (rainSound) {
                    if (isRaining) {
                        rainSound.play();
                    } else {
                        rainSound.pause();
                    }
                }
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': moveForward = false; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
            case 'KeyS': case 'ArrowDown': moveBackward = false; break;
            case 'KeyD': case 'ArrowRight': moveRight = false; break;
        }
    });

    return newControls;
}

// ======== Animation Loop ========
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // --- Day/Night Cycle Logic ---
    const transitionSpeed = 0.5;
    if (isDay) {
        timeOfDay = Math.min(1, timeOfDay + delta * transitionSpeed);
    } else {
        timeOfDay = Math.max(0, timeOfDay - delta * transitionSpeed);
    }

    const nightSunIntensity = 0.1;
    const daySunIntensity = 2.0;
    const nightSunColor = new THREE.Color(0x000000);
    const daySunColor = new THREE.Color(0xFFCF94);

    const nightSkyTurbidity = 5;
    const daySkyTurbidity = 2;
    const nightSkyRayleigh = 0.5;
    const daySkyRayleigh = 1;
    const nightSkyMieCoefficient = 0.005;
    const daySkyMieCoefficient = 0.001;
    const nightSkyMieDirectionalG = 0.8;
    const daySkyMieDirectionalG = 0.7;

    const nightFogColor = new THREE.Color(0x050515);
    const dayFogColor = new THREE.Color(0xC0C0C0);

    const nightElevation = -10;
    const dayElevation = 30;

    sunLight.intensity = THREE.MathUtils.lerp(nightSunIntensity, daySunIntensity, timeOfDay);
    sunLight.color.lerpColors(nightSunColor, daySunColor, timeOfDay);

    sky.material.uniforms['turbidity'].value = THREE.MathUtils.lerp(nightSkyTurbidity, daySkyTurbidity, timeOfDay);
    sky.material.uniforms['rayleigh'].value = THREE.MathUtils.lerp(nightSkyRayleigh, daySkyRayleigh, timeOfDay);
    sky.material.uniforms['mieCoefficient'].value = THREE.MathUtils.lerp(nightSkyMieCoefficient, daySkyMieCoefficient, timeOfDay);
    sky.material.uniforms['mieDirectionalG'].value = THREE.MathUtils.lerp(nightSkyMieDirectionalG, daySkyMieDirectionalG, timeOfDay);

    const currentElevation = THREE.MathUtils.lerp(nightElevation, dayElevation, timeOfDay);
    const phi = THREE.MathUtils.degToRad(90 - currentElevation);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    sunLight.position.copy(sun).multiplyScalar(100);

    scene.fog.color.lerpColors(nightFogColor, dayFogColor, timeOfDay);
    renderer.setClearColor(scene.fog.color);

    // --- Rain Animation Logic ---
    if (isRaining && rainParticles) {
        const positions = rainParticles.geometry.attributes.position.array;
        const playerX = controls.getObject().position.x;
        const playerZ = controls.getObject().position.z;

        for (let i = 0; i < rainDropCount; i++) {
            positions[i * 3 + 1] -= rainSpeed * delta;

            if (positions[i * 3 + 1] < -10) {
                positions[i * 3 + 1] = rainAreaSize / 2;
                positions[i * 3] = playerX + (Math.random() * rainAreaSize) - (rainAreaSize / 2);
                positions[i * 3 + 2] = playerZ + (Math.random() * rainAreaSize) - (rainAreaSize / 2);
            }
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // --- Player Movement ---
    if (controls && controls.isLocked) {
        const moveSpeed = 5.0 * delta;
        if (moveForward) controls.moveForward(moveSpeed);
        if (moveBackward) controls.moveForward(-moveSpeed);
        if (moveLeft) controls.moveRight(-moveSpeed);
        if (moveRight) controls.moveRight(moveSpeed);

        // --- Waterfall Sound Proximity Control ---
        if (waterfallSound && waterfallSoundSource && controls.getObject()) {
            const distance = controls.getObject().position.distanceTo(waterfallSoundSource.position);
            const maxDistance = waterfallSound.maxDistance;

            const deactivationDistance = maxDistance + 5;

            if (distance > deactivationDistance) {
                if (waterfallSound.isPlaying) {
                    waterfallSound.pause();
                    // console.log("Waterfall paused (due to distance). Distance:", distance.toFixed(2)); // Uncomment for debug
                }
            } else {
                const listener = camera.children.find(child => child instanceof THREE.AudioListener);
                if (!waterfallSound.isPlaying && listener && listener.context.state === 'running') {
                    waterfallSound.play();
                    // console.log("Waterfall playing (resumed by proximity). Distance:", distance.toFixed(2)); // Uncomment for debug
                }
            }
        }
    }

    renderer.render(scene, camera);
}

// ======== Event Handlers ========
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ======== Start ========
window.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});