const canvas = document.getElementById('subwayCanvas');
const ctx = canvas.getContext('2d');

// Elementos da UI
const scoreVal = document.getElementById('score-val');
const coinsVal = document.getElementById('coins-val');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const finalCoins = document.getElementById('final-coins');
const restartBtn = document.getElementById('restart-btn');

// Configurações Gerais do Estado do Jogo
let score = 0;
let coins = 0;
let gameSpeed = 0.005; // Velocidade de progressão do 3D
let currentSpeed = 0.005;
let isGameOver = false;
let gameTime = 0;
let entities = [];

// Ponto de fuga do efeito 3D (Horizonte)
const horizonX = canvas.width / 2;
const horizonY = 220; 

// Estrutura do Jogador
const player = {
    lane: 1, // 0 = Esquerda, 1 = Meio, 2 = Direita
    targetLane: 1,
    laneProgress: 1, // Para transição suave entre pistas
    
    // Física de pulo e agachamento
    yOffset: 0,
    velocity: 0,
    gravity: -0.7,
    isJumping: false,
    isRolling: false,
    rollTimer: 0,
    
    // Dimensões base na tela (quando está perto da câmera)
    width: 55,
    height: 85
};

// Captura de comandos do teclado
document.addEventListener('keydown', (e) => {
    if (isGameOver) {
        if (e.code === 'Space') resetGame();
        return;
    }

    switch(e.code) {
        case 'ArrowLeft':
            if (player.targetLane > 0) player.targetLane--;
            break;
        case 'ArrowRight':
            if (player.targetLane < 2) player.targetLane++;
            break;
        case 'ArrowUp':
        case 'Space':
            if (!player.isJumping && !player.isRolling) {
                player.isJumping = true;
                player.velocity = 14; // Força do pulo
            }
            break;
        case 'ArrowDown':
            if (!player.isJumping && !player.isRolling) {
                player.isRolling = true;
                player.rollTimer = 25; // Duração do rolamento em frames
            } else if (player.isJumping) {
                // Queda rápida (Fast Fall) comum no Subway Surfers original
                player.velocity = -10;
            }
            break;
    }
});

restartBtn.addEventListener('click', resetGame);

// Classe Base para Objetos 3D (Trens, Barreiras e Moedas)
class Entity {
    constructor(type) {
        this.type = type; // 'train', 'high-barrier', 'low-barrier', 'coin'
        this.lane = Math.floor(Math.random() * 3);
        this.z = 0; // Progresso do horizonte até a tela (0 a 1)
        this.alive = true;
        
        // Configuração visual específica por tipo
        if (this.type === 'coin') {
            // Moedas costumam vir em fileiras, z pode ser alterado externamente
            this.color = '#facc15';
        }
    }

    update() {
        // Move o objeto em direção à tela de forma exponencial (Efeito 3D)
        this.z += currentSpeed;
        if (this.z >= 1) {
            this.alive = false;
            if (this.type !== 'coin' && !isGameOver) {
                score += 15; // Pontos por desviar de obstáculos
            }
        }
    }

    getRenderCoords() {
        // Calcula a projeção 3D com base no valor de Z (0 = horizonte, 1 = base da tela)
        const scale = this.z; // Quanto mais perto, maior
        
        // Interpolação das linhas de trilho convergindo no horizonte
        const startXAtHorizon = horizonX;
        const endXAtBottom = (this.lane - 1) * 160 + horizonX;
        const currentX = startXAtHorizon + (endXAtBottom - startXAtHorizon) * scale;
        const currentY = horizonY + (canvas.height - horizonY) * scale;
        
        return { x: currentX, y: currentY, scale: scale };
    }

    draw() {
        if (!this.alive || this.z <= 0.05) return; // Não desenha muito longe no horizonte

        const coords = this.getRenderCoords();
        const sWidth = 70 * coords.scale;
        const sHeight = 90 * coords.scale;

        ctx.save();
        
        if (this.type === 'train') {
            // Desenha um vagão de trem texturizado
            ctx.fillStyle = '#b91c1c'; // Vermelho Metálico
            ctx.fillRect(coords.x - sWidth/2, coords.y - sHeight, sWidth, sHeight);
            
            // Teto do trem
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(coords.x - sWidth/2, coords.y - sHeight, sWidth, sHeight * 0.15);
            
            // Vidro Frontal
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(coords.x - sWidth/2 + (sWidth*0.1), coords.y - sHeight + (sHeight*0.2), sWidth*0.8, sHeight * 0.2);
            
            // Grades/Detalhes frontais
            ctx.fillStyle = '#451a03';
            ctx.fillRect(coords.x - sWidth/2 + (sWidth*0.2), coords.y - sHeight * 0.3, sWidth*0.6, sHeight * 0.2);

        } else if (this.type === 'high-barrier') {
            // Barreira alta: Exige ROLAR por baixo
            const bHeight = 75 * coords.scale;
            ctx.fillStyle = '#334155'; // Postes de suporte
            ctx.fillRect(coords.x - sWidth/2, coords.y - bHeight, 8 * coords.scale, bHeight);
            ctx.fillRect(coords.x + sWidth/2 - 8 * coords.scale, coords.y - bHeight, 8 * coords.scale, bHeight);
            
            // Placa superior amarela e preta listrada
            ctx.fillStyle = '#eab308';
            ctx.fillRect(coords.x - sWidth/2, coords.y - bHeight, sWidth, 25 * coords.scale);
            
            ctx.fillStyle = '#000';
            ctx.font = `${Math.floor(12 * coords.scale)}px Arial`;
            ctx.fillText("KEEP CLEAR", coords.x - (25 * coords.scale), coords.y - bHeight + (18 * coords.scale));

        } else if (this.type === 'low-barrier') {
            // Barreira baixa: Exige PULAR por cima
            const bHeight = 35 * coords.scale;
            ctx.fillStyle = '#ea580c'; // Laranja de sinalização
            ctx.fillRect(coords.x - sWidth/2, coords.y - bHeight, sWidth, bHeight);
            
            // Faixa branca central
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(coords.x - sWidth/2, coords.y - bHeight + (10 * coords.scale), sWidth, 10 * coords.scale);

        } else if (this.type === 'coin') {
            // Moeda Dourada Rotativa com efeito de brilho
            const coinRadius = 15 * coords.scale;
            const pulse = Math.sin(gameTime * 0.2) * (coinRadius * 0.2);
            
            ctx.beginPath();
            ctx.arc(coords.x, coords.y - (30 * coords.scale), Math.max(2, coinRadius + pulse), 0, Math.PI * 2);
            ctx.fillStyle = '#facc15';
            ctx.fill();
            ctx.lineWidth = 2 * coords.scale;
            ctx.strokeStyle = '#ca8a04';
            ctx.stroke();
            
            // Centro da moeda
            ctx.beginPath();
            ctx.arc(coords.x, coords.y - (30 * coords.scale), coinRadius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#fef08a';
            ctx.fill();
        }

        ctx.restore();
    }

    checkCollision() {
        if (!this.alive || this.z < 0.82 || this.z > 0.95) return; // Só colide se estiver muito perto do jogador
        if (this.lane !== player.lane) return; // Precisa estar na mesma pista

        if (this.type === 'coin') {
            // Moeda coletada! Só valida se não estiver muito alto pulando fora de alcance
            if (player.yOffset < 80) {
                this.alive = false;
                this.entitiesToRemove = true;
                coins++;
                score += 50;
            }
        } else if (this.type === 'train') {
            // Trem ocupa o espaço todo do chão. Se não estiver no ar pulando mais alto que ele, morre
            if (player.yOffset < 60) gameOver();
        } else if (this.type === 'low-barrier') {
            // Barreira baixa. Morre se não estiver pulando (yOffset alto)
            if (player.yOffset < 30) gameOver();
        } else if (this.type === 'high-barrier') {
            // Barreira alta. Morre se estiver em pé ou pulando. Salva-se se estiver ROLANDO
            if (!player.isRolling) gameOver();
        }
    }
}

// Renderização do cenário pseudo-3D de fundo
function drawScenario() {
    // Céu de fim de tarde de fundo (gradiente urbano)
    let skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#f97316'); // Laranja forte
    skyGrad.addColorStop(1, '#fef08a'); // Amarelo no horizonte
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, horizonY);

    // Chão das pistas (Chão de concreto cinza escuro)
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

    // Desenho dos Trilhos do Trem convergindo no ponto de fuga
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    
    const bottomLanesX = [-80, horizonX, canvas.width + 80]; // Posições finais dos 3 trilhos embaixo
    
    for(let i = 0; i < 3; i++) {
        // Linhas laterais das pistas
        ctx.beginPath();
        ctx.moveTo(horizonX, horizonY);
        ctx.lineTo((i - 1) * 160 + horizonX, canvas.height);
        ctx.stroke();

        // Travessas de madeira dos trilhos (linhas horizontais de perspectiva)
        ctx.fillStyle = '#475569';
        for(let j = 1; j <= 10; j++) {
            let ratio = j / 10;
            let currentY = horizonY + (canvas.height - horizonY) * (ratio * ratio); // Curva exponencial para profundidade
            let currentW = 80 * (ratio * ratio);
            let currentX = horizonX + ((i - 1) * 160) * (ratio * ratio);
            
            ctx.fillRect(currentX - currentW/2, currentY, currentW, 4 * ratio);
        }
    }
}

function updatePlayer() {
    // Suaviza a troca de pistas lateral
    player.laneProgress += (player.targetLane - player.laneProgress) * 0.22;
    if (Math.abs(player.laneProgress - player.targetLane) < 0.05) {
        player.lane = player.targetLane;
    }
    
    // Atualiza pista lógica imediata baseado em proximidade física para evitar bugs visuais
    if (player.laneProgress < 0.5) player.lane = 0;
    else if (player.laneProgress >= 0.5 && player.laneProgress <= 1.5) player.lane = 1;
    else player.lane = 2;

    // Física do Pulo
    if (player.isJumping) {
        player.yOffset += player.velocity;
        player.velocity += player.gravity; // Aplica gravidade acelerando para baixo
        
        if (player.yOffset <= 0) {
            player.yOffset = 0;
            player.isJumping = false;
        }
    }

    // Lógica do Agachamento/Rolamento
    if (player.isRolling) {
        player.rollTimer--;
        if (player.rollTimer <= 0) {
            player.isRolling = false;
        }
    }
}

function drawPlayer() {
    // Define a posição X calculada dinamicamente pela transição de pistas
    const targetXAtBottom = (player.laneProgress - 1) * 160 + horizonX;
    
    // Altura modificada se estiver rolando (achata o personagem)
    let pWidth = player.width;
    let pHeight = player.isRolling ? player.height * 0.5 : player.height;
    
    // Ajusta a posição Y com base no pulo e no encolhimento do rolamento
    let pX = targetXAtBottom - pWidth / 2;
    let pY = (canvas.height - 40) - pHeight - player.yOffset;

    ctx.save();
    
    // Sombra projetada abaixo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(targetXAtBottom, canvas.height - 35, pWidth * 0.6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Roupas e Corpo do Surfista (Inspirado nas cores do Jake)
    ctx.fillStyle = '#ea580c'; // Casaco Vermelho Alaranjado
    ctx.fillRect(pX, pY, pWidth, pHeight);
    
    // Calças
    ctx.fillStyle = '#1d4ed8'; // Jeans Azul
    ctx.fillRect(pX, pY + pHeight * 0.7, pWidth, pHeight * 0.3);

    // Boné (Virado para trás)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(pX, pY, pWidth, pHeight * 0.15);
    ctx.fillStyle = '#ffffff'; // Detalhe branco
    ctx.fillRect(pX + pWidth * 0.2, pY + pHeight * 0.05, pWidth * 0.6, pHeight * 0.05);

    ctx.restore();
}

function generateObstacles() {
    gameTime++;

    // Gera novos objetos periodicamente baseado na velocidade atual
    if (gameTime % 70 === 0) {
        const rand = Math.random();
        if (rand < 0.4) {
            entities.push(new Entity('train'));
        } else if (rand < 0.65) {
            entities.push(new Entity('low-barrier'));
        } else if (rand < 0.8) {
            entities.push(new Entity('high-barrier'));
        }
    }

    // Geração procedural de linhas de moedas
    if (gameTime % 120 === 0 && Math.random() < 0.6) {
        let coinLane = Math.floor(Math.random() * 3);
        // Cria uma sequência consecutiva de 3 moedas espaçadas em profundidade Z
        for (let k = 0; k < 3; k++) {
            let coin = new Entity('coin');
            coin.lane = coinLane;
            coin.z = -k * 0.12; // Começam enfileiradas uma atrás da outra
            entities.push(coin);
        }
    }
}

function gameOver() {
    isGameOver = true;
    finalScore.textContent = score;
    finalCoins.textContent = coins;
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    score = 0;
    coins = 0;
    gameTime = 0;
    currentSpeed = gameSpeed;
    entities = [];
    
    player.lane = 1;
    player.targetLane = 1;
    player.laneProgress = 1;
    player.yOffset = 0;
    player.isJumping = false;
    player.isRolling = false;
    
    gameOverScreen.classList.add('hidden');
    isGameOver = false;
    
    tick();
}

// Loop Principal do Motor de Jogo
function tick() {
    if (isGameOver) return;

    // 1. Limpeza do quadro anterior
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Renderização do ambiente estático e dinâmico
    drawScenario();
    generateObstacles();

    // 3. Processamento e desenho das entidades ordenadas por Z (longe primeiro)
    entities.sort((a, b) => a.z - b.z);
    
    for (let i = entities.length - 1; i >= 0; i--) {
        let ent = entities[i];
        ent.update();
        ent.checkCollision();
        ent.draw();

        // Remove os lixos de objetos que saíram da área útil da tela
        if (!ent.alive) {
            entities.splice(i, 1);
        }
    }

    // 4. Mecânicas e Desenho do Jogador
    updatePlayer();
    drawPlayer();

    // 5. Atualização da Interface
    scoreVal.textContent = String(score).padStart(5, '0');
    coinsVal.textContent = coins;

    // Aceleração progressiva de dificuldade
    currentSpeed += 0.000001;

    requestAnimationFrame(tick);
}

// Dispara o jogo
resetGame();
