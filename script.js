import * as THREE from 'three';

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
);

const renderer = new THREE.WebGLRenderer({
antialias:true
});

renderer.setSize(
window.innerWidth,
window.innerHeight
);

document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(
0xffffff,
2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
0xffffff,
3
);

sun.position.set(10,20,10);

scene.add(sun);

const laneX = [-4,0,4];

let currentLane = 1;

let speed = 0.35;

let score = 0;

let jumping = false;

let velocityY = 0;

const gravity = -0.02;

const player = new THREE.Mesh(
new THREE.BoxGeometry(1,2,1),
new THREE.MeshStandardMaterial({
color:0xff3333
})
);

player.position.y = 1;

scene.add(player);

camera.position.set(
0,
6,
10
);

function createGround(){

const geo = new THREE.BoxGeometry(
12,
1,
400
);

const mat = new THREE.MeshStandardMaterial({
color:0x555555
});

const road = new THREE.Mesh(
geo,
mat
);

road.position.z = -180;

scene.add(road);

for(let i=-200;i<200;i+=5){

const line = new THREE.Mesh(
new THREE.BoxGeometry(0.2,0.05,2),
new THREE.MeshStandardMaterial({
color:0xffffff
})
);

line.position.z = i;
line.position.y = 0.51;

scene.add(line);

}

}

createGround();

const obstacles = [];

function spawnObstacle(){

const cube = new THREE.Mesh(
new THREE.BoxGeometry(1.5,2,1.5),
new THREE.MeshStandardMaterial({
color:0x222222
})
);

cube.position.x =
laneX[Math.floor(Math.random()*3)];

cube.position.y = 1;

cube.position.z = -120;

scene.add(cube);

obstacles.push(cube);

}

const coins = [];

function spawnCoin(){

const coin = new THREE.Mesh(
new THREE.CylinderGeometry(
0.5,
0.5,
0.2,
32
),
new THREE.MeshStandardMaterial({
color:0xffd700,
emissive:0xaa8800
})
);

coin.rotation.z = Math.PI/2;

coin.position.x =
laneX[Math.floor(Math.random()*3)];

coin.position.y = 2;

coin.position.z = -120;

scene.add(coin);

coins.push(coin);

}

setInterval(()=>{
spawnObstacle();
},1000);

setInterval(()=>{
spawnCoin();
},700);

document.addEventListener(
'keydown',
e=>{

if(e.key==="ArrowLeft"){

currentLane=Math.max(
0,
currentLane-1
);

}

if(e.key==="ArrowRight"){

currentLane=Math.min(
2,
currentLane+1
);

}

if(e.key==="ArrowUp" && !jumping){

jumping=true;

velocityY=0.35;

}

}
);

function gameOver(){

alert(
"Game Over\nPontos: "+score
);

location.reload();

}

function animate(){

requestAnimationFrame(
animate
);

player.position.x +=
(
laneX[currentLane]
-
player.position.x
)
*
0.2;

if(jumping){

player.position.y += velocityY;

velocityY += gravity;

if(player.position.y <= 1){

player.position.y = 1;

jumping = false;

}

}

for(let i=obstacles.length-1;i>=0;i--){

const obs = obstacles[i];

obs.position.z += speed*5;

if(obs.position.z > 10){

scene.remove(obs);

obstacles.splice(i,1);

continue;

}

const dist =
player.position.distanceTo(
obs.position
);

if(dist < 1.4){

gameOver();

}

}

for(let i=coins.length-1;i>=0;i--){

const coin = coins[i];

coin.position.z += speed*5;

coin.rotation.y += 0.1;

if(coin.position.z > 10){

scene.remove(coin);

coins.splice(i,1);

continue;

}

const dist =
player.position.distanceTo(
coin.position
);

if(dist < 1.2){

scene.remove(coin);

coins.splice(i,1);

score += 10;

document.getElementById(
"score"
).innerText = score;

}

}

speed += 0.00003;

camera.position.x =
player.position.x;

camera.lookAt(
player.position.x,
1,
-10
);

renderer.render(
scene,
camera
);

}

animate();

window.addEventListener(
'resize',
()=>{

camera.aspect =
window.innerWidth/
window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(
window.innerWidth,
window.innerHeight
);

}
);
