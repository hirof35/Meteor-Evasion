const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 画像読み込み
const shipImg = new Image(); shipImg.src = 'player.png';
const meteorImg = new Image(); meteorImg.src = 'meteor.png';

// 難易度ごとのパラメータ
const difficultySettings = {
    'EASY':   { spawnRate: 40, speedMin: 1, speedMax: 2, accel: 0.6 },
    'NORMAL': { spawnRate: 20, speedMin: 2, speedMax: 5, accel: 0.8 },
    'HARD':   { spawnRate: 10, speedMin: 3, speedMax: 10, accel: 1.0 }
};

let currentSetting = null;
let isStarted = false;
let ship, meteors, frames, gameOver, score, keys;

// ゲーム開始関数
function startGame(mode) {
    currentSetting = difficultySettings[mode];
    document.getElementById("menu").style.display = "none"; // メニューを隠す
    initGame();
    isStarted = true;
    draw();
}

// 初期化
function initGame() {
    ship = { x: 180, y: 500, w: 50, h: 50, vx: 0, accel: currentSetting.accel, friction: 0.9, maxSpeed: 8 };
    meteors = [];
    frames = 0;
    gameOver = false;
    score = 0;
    keys = {};
}

window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

function update() {
    if (gameOver || !isStarted) return;

    // 宇宙船移動
    if (keys["ArrowLeft"]) ship.vx -= ship.accel;
    if (keys["ArrowRight"]) ship.vx += ship.accel;
    ship.vx *= ship.friction;
    ship.x += ship.vx;
    if (ship.x < 0) ship.x = 0;
    if (ship.x > canvas.width - ship.w) ship.x = canvas.width - ship.w;

    // 隕石生成 (難易度ごとの頻度)
    if (frames % currentSetting.spawnRate === 0) {
        meteors.push({
            x: Math.random() * (canvas.width - 40),
            y: -50,
            size: 30 + Math.random() * 30,
            speed: currentSetting.speedMin + Math.random() * (currentSetting.speedMax - currentSetting.speedMin),
            angle: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }

    meteors.forEach((m, i) => {
        m.y += m.speed;
        m.angle += m.rotationSpeed;
    
        // --- 当たり判定の調整 ---
        // 実際の画像サイズより少し内側に判定を狭める（マージンを設定）
        const shipPadding = 12;  // 宇宙船の判定を左右上下12pxずつ狭める
        const meteorPadding = m.size * 0.2; // 隕石の判定をサイズに応じて20%狭める
    
        const sLeft   = ship.x + shipPadding;
        const sRight  = ship.x + ship.w - shipPadding;
        const sTop    = ship.y + shipPadding;
        const sBottom = ship.y + ship.h - shipPadding;
    
        const mLeft   = m.x + meteorPadding;
        const mRight  = m.x + m.size - meteorPadding;
        const mTop    = m.y + meteorPadding;
        const mBottom = m.y + m.size - meteorPadding;
    
        // 衝突判定（矩形同士の重なり）[cite: 1]
        if (sLeft < mRight && sRight > mLeft &&
            sTop < mBottom && sBottom > mTop) {
            gameOver = true;
        }
        // -----------------------
    
        if (m.y > canvas.height) {
            meteors.splice(i, 1);
            score++;
        }
    });
    frames++;
}

function draw() {
    if (!isStarted) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 宇宙船
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.rotate(ship.vx * 0.05);
    ctx.drawImage(shipImg, -ship.w / 2, -ship.h / 2, ship.w, ship.h);
    ctx.restore();

    // 隕石
    meteors.forEach(m => {
        ctx.save();
        ctx.translate(m.x + m.size / 2, m.y + m.size / 2);
        ctx.rotate(m.angle);
        ctx.drawImage(meteorImg, -m.size / 2, -m.size / 2, m.size, m.size);
        ctx.restore();
    });

    // スコア[cite: 1]
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);

    if (gameOver) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "30px Arial";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.font = "20px Arial";
        ctx.fillText("Press F5 to Restart", canvas.width/2, canvas.height/2 + 40);
    } else {
        update();
        requestAnimationFrame(draw);
    }
}
