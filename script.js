const player = document.getElementById('player');
const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');

let isJumping = false;
let position = 0;
let obstacles = [];
let score = 0;
let gameInterval;
let obstacleInterval;

function startGame() {
    // Reset
    obstacles.forEach(obs => obs.remove());
    obstacles = [];
    score = 0;
    scoreDisplay.textContent = "Pontuação: 0";
    position = 0;
    player.style.bottom = position + 'px';
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);

    // Criar obstáculos
    obstacleInterval = setInterval(createObstacle, 2000);

    // Loop do jogo
    gameInterval = setInterval(updateGame, 20);
}

function jump() {
    if (isJumping) return;
    isJumping = true;

    let upInterval = setInterval(() => {
        if (position >= 150) {
            clearInterval(upInterval);
            let downInterval = setInterval(() => {
                if (position <= 0) {
                    clearInterval(downInterval);
                    isJumping = false;
                }
                position -= 5;
                player.style.bottom = position + 'px';
            }, 20);
        }
        position += 5;
        player.style.bottom = position + 'px';
    }, 20);
}

function createObstacle() {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    gameArea.appendChild(obstacle);
    let obstaclePosition = 600;
    obstacle.style.right = '0px';
    obstacles.push(obstacle);

    function moveObstacle() {
        if (obstaclePosition > 620) {
            obstacle.remove();
            obstacles = obstacles.filter(o => o !== obstacle);
            score++;
            scoreDisplay.textContent = "Pontuação: " + score;
            return;
        }

        obstaclePosition += 5;
        obstacle.style.right = obstaclePosition + 'px';

        // Checar colisão
        if (
            obstaclePosition > 50 &&
            obstaclePosition < 80 &&
            position < 30
        ) {
            alert("Game Over! Sua pontuação: " + score);
            startGame();
        } else {
            requestAnimationFrame(moveObstacle);
        }
    }

    requestAnimationFrame(moveObstacle);
}

function updateGame() {
    // Futuras animações
}

// Captura do teclado
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        jump();
    }
});
