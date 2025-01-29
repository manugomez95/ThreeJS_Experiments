import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

// Calculate space dimensions based on screen aspect ratio
const baseSize = 10;
const spaceWidth = baseSize * aspectRatio;
const spaceHeight = baseSize;

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
const groundGeometry = new THREE.PlaneGeometry(spaceWidth, spaceHeight);
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

// Create walls and ceiling
function createWall(position, rotation, dimensions) {
    // Visual wall
    const wallGeometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.4,
        metalness: 0.3,
        transparent: true,
        opacity: 0.2
    });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.copy(position);
    wallMesh.rotation.copy(rotation);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    // Physics wall
    const wallShape = new CANNON.Box(new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2));
    const wallBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: wallShape
    });
    wallBody.position.copy(position);
    wallBody.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
    world.addBody(wallBody);
}

// Create all walls and ceiling
// Left wall
createWall(
    new THREE.Vector3(-spaceWidth/2, 5, 0),
    new THREE.Euler(0, 0, 0),
    new THREE.Vector3(0.2, 10, spaceHeight)
);

// Right wall
createWall(
    new THREE.Vector3(spaceWidth/2, 5, 0),
    new THREE.Euler(0, 0, 0),
    new THREE.Vector3(0.2, 10, spaceHeight)
);

// Back wall
createWall(
    new THREE.Vector3(0, 5, -spaceHeight/2),
    new THREE.Euler(0, Math.PI / 2, 0),
    new THREE.Vector3(0.2, 10, spaceWidth)
);

// Front wall
createWall(
    new THREE.Vector3(0, 5, spaceHeight/2),
    new THREE.Euler(0, Math.PI / 2, 0),
    new THREE.Vector3(0.2, 10, spaceWidth)
);

// Ceiling
createWall(
    new THREE.Vector3(0, 10, 0),
    new THREE.Euler(Math.PI / 2, 0, 0),
    new THREE.Vector3(spaceWidth, spaceHeight, 0.2)
);

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

// Camera position for top view
camera.position.set(0, 15, 0);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, -1); // This makes the camera's up direction point towards -z

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newAspectRatio = width / height;
    
    // Update space dimensions
    const newSpaceWidth = baseSize * newAspectRatio;
    
    // Update ground
    ground.geometry = new THREE.PlaneGeometry(newSpaceWidth, spaceHeight);
    
    // Update walls positions and dimensions
    scene.children.forEach(child => {
        if (child.isMesh && child !== ground && child !== dice1.mesh && child !== dice2.mesh) {
            const isVerticalWall = child.rotation.y === 0;
            if (isVerticalWall) {
                // Left and right walls
                const x = child.position.x < 0 ? -newSpaceWidth/2 : newSpaceWidth/2;
                child.position.setX(x);
                child.geometry = new THREE.BoxGeometry(0.2, 10, spaceHeight);
            } else if (child.rotation.y === Math.PI / 2) {
                // Front and back walls
                child.geometry = new THREE.BoxGeometry(0.2, 10, newSpaceWidth);
            } else {
                // Ceiling
                child.geometry = new THREE.BoxGeometry(newSpaceWidth, spaceHeight, 0.2);
            }
        }
    });
    
    // Update renderer and camera
    renderer.setSize(width, height);
    camera.aspect = newAspectRatio;
    camera.updateProjectionMatrix();
});

// Click event handler for throwing dice
window.addEventListener('click', () => {
    // Random force values
    const throwForce = 5;
    const rotationForce = 5;
    
    // Apply random forces to dice1
    dice1.body.velocity.set(
        (Math.random() - 0.5) * throwForce,
        throwForce,
        (Math.random() - 0.5) * throwForce
    );
    dice1.body.angularVelocity.set(
        (Math.random() - 0.5) * rotationForce,
        (Math.random() - 0.5) * rotationForce,
        (Math.random() - 0.5) * rotationForce
    );
    
    // Apply random forces to dice2
    dice2.body.velocity.set(
        (Math.random() - 0.5) * throwForce,
        throwForce,
        (Math.random() - 0.5) * throwForce
    );
    dice2.body.angularVelocity.set(
        (Math.random() - 0.5) * rotationForce,
        (Math.random() - 0.5) * rotationForce,
        (Math.random() - 0.5) * rotationForce
    );
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