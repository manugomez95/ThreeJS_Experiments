import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Physics world setup
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.4,
    metalness: 0.3
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Ground physics
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Dice creation function
function createDice(position) {
    // Visual dice
    const diceGeometry = new THREE.BoxGeometry(1, 1, 1);
    const diceMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.4,
        metalness: 0.3
    });
    const diceMesh = new THREE.Mesh(diceGeometry, diceMaterial);
    diceMesh.castShadow = true;
    diceMesh.position.copy(position);
    scene.add(diceMesh);

    // Physics dice
    const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const diceBody = new CANNON.Body({
        mass: 1,
        shape: diceShape,
        position: new CANNON.Vec3(position.x, position.y, position.z)
    });
    world.addBody(diceBody);

    return { mesh: diceMesh, body: diceBody };
}

// Create two dice
const dice1 = createDice(new THREE.Vector3(0, 5, 0));
const dice2 = createDice(new THREE.Vector3(1, 7, 0));

// Camera position
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Device orientation handling
window.addEventListener('deviceorientation', (event) => {
    const beta = event.beta * Math.PI / 180; // X-axis rotation
    const gamma = event.gamma * Math.PI / 180; // Y-axis rotation
    
    // Update gravity based on device orientation
    world.gravity.set(
        Math.sin(gamma) * 9.82,
        -Math.cos(beta) * 9.82,
        Math.sin(beta) * 9.82
    );
});

// Animation loop
const timeStep = 1 / 60;
function animate() {
    requestAnimationFrame(animate);

    // Update physics
    world.step(timeStep);

    // Update dice positions
    dice1.mesh.position.copy(dice1.body.position);
    dice1.mesh.quaternion.copy(dice1.body.quaternion);
    
    dice2.mesh.position.copy(dice2.body.position);
    dice2.mesh.quaternion.copy(dice2.body.quaternion);

    renderer.render(scene, camera);
}

animate(); 