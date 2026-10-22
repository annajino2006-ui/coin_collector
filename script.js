"use strict";

(() => {
  const WORLD_WIDTH = 960;
  const WORLD_HEIGHT = 600;
  const canvas = document.getElementById("game-canvas");
  const context = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");
  const timerElement = document.getElementById("timer");
  const timerWrap = document.getElementById("timer-wrap");
  const livesElement = document.getElementById("lives");
  const bestElement = document.getElementById("best-score");
  const startScreen = document.getElementById("start-screen");
  const pauseScreen = document.getElementById("pause-screen");
  const overScreen = document.getElementById("over-screen");
  const pauseButton = document.getElementById("pause-button");
  const pauseIcon = document.getElementById("pause-icon");
  const soundButton = document.getElementById("sound-toggle");
  const soundIcon = document.getElementById("sound-icon");

  const keys = new Set();
  const heldDirections = new Set();
  const decorations = [];
  const particles = [];
  let state = "title";
  let animationId = 0;
  let lastFrameTime = 0;
  let elapsed = 0;
  let score = 0;
  let lives = 3;
  let invulnerableFor = 0;
  let soundEnabled = true;
  let audioContext = null;
  let bestScore = readBestScore();

  const player = { x: 480, y: 310, radius: 19, speed: 260, facing: 1 };
  let coin = { x: 660, y: 290, phase: 0 };
  let enemies = [];

  function readBestScore() {
    try {
      return Number(localStorage.getItem("meadowDashBest")) || 0;
    } catch {
      return 0;
    }
  }

  function saveBestScore() {
    try {
      localStorage.setItem("meadowDashBest", String(bestScore));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }

  bestElement.textContent = String(bestScore);

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    context.setTransform(
      canvas.width / WORLD_WIDTH,
      0,
      0,
      canvas.height / WORLD_HEIGHT,
      0,
      0,
    );
    draw();
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function createDecorations() {
    let seed = 398174;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let index = 0; index < 66; index += 1) {
      decorations.push({
        x: 18 + next() * (WORLD_WIDTH - 36),
        y: 18 + next() * (WORLD_HEIGHT - 36),
        type:
          index % 5 === 0
            ? "flower"
            : index % 7 === 0
              ? "stone"
              : index % 3 === 0
                ? "bush"
                : "grass",
        size: 3 + next() * 6,
        hue: next(),
      });
    }
  }

  function drawWorld() {
    context.fillStyle = "#9bd36e";
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.fillStyle = "#a7dc78";
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 12; col += 1) {
        if ((row + col) % 2 === 0)
          context.fillRect(col * 80 + 3, row * 76 + 3, 75, 71);
      }
    }

    context.save();
    context.lineCap = "round";
    context.strokeStyle = "#d8c88d";
    context.lineWidth = 93;
    context.beginPath();
    context.moveTo(-35, 485);
    context.bezierCurveTo(190, 440, 205, 560, 420, 494);
    context.bezierCurveTo(625, 430, 715, 520, 1000, 420);
    context.stroke();
    context.strokeStyle = "#e7d9a7";
    context.lineWidth = 5;
    context.setLineDash([9, 13]);
    context.beginPath();
    context.moveTo(-35, 485);
    context.bezierCurveTo(190, 440, 205, 560, 420, 494);
    context.bezierCurveTo(625, 430, 715, 520, 1000, 420);
    context.stroke();
    context.restore();

    decorations.forEach((item) => {
      if (item.type === "grass") {
        context.strokeStyle = "#6eae57";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(item.x, item.y + 3);
        context.lineTo(item.x - 2, item.y - item.size);
        context.moveTo(item.x + 1, item.y + 3);
        context.lineTo(item.x + 4, item.y - item.size * 0.75);
        context.stroke();
      } else if (item.type === "flower") {
        const colors = ["#fff5c9", "#f77e67", "#f7f4eb"];
        context.fillStyle = colors[Math.floor(item.hue * colors.length)];
        for (let petal = 0; petal < 4; petal += 1) {
          const angle = (petal * Math.PI) / 2;
          context.beginPath();
          context.arc(
            item.x + Math.cos(angle) * 3,
            item.y + Math.sin(angle) * 3,
            2.5,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
        context.fillStyle = "#e9bb42";
        context.beginPath();
        context.arc(item.x, item.y, 2, 0, Math.PI * 2);
        context.fill();
      } else if (item.type === "bush") {
        context.fillStyle = "#77b75c";
        context.beginPath();
        context.arc(item.x, item.y, 7, 0, Math.PI * 2);
        context.arc(item.x + 6, item.y + 2, 5, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#91ca6a";
        context.beginPath();
        context.arc(item.x - 2, item.y - 2, 3, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = "#bac7a0";
        context.beginPath();
        context.ellipse(item.x, item.y, 6, 4, -0.25, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#d6ddbc";
        context.beginPath();
        context.ellipse(item.x - 1, item.y - 1, 3, 1.5, -0.25, 0, Math.PI * 2);
        context.fill();
      }
    });

    drawTree(77, 110, 1);
    drawTree(865, 125, 0.88);
    drawTree(855, 510, 0.78);
    drawTree(118, 535, 0.7);
  }

  function drawTree(x, y, scale) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    context.fillStyle = "#795b3b";
    context.fillRect(-5, 10, 10, 25);
    context.fillStyle = "#558c51";
    context.beginPath();
    context.arc(-10, 4, 19, 0, Math.PI * 2);
    context.arc(10, 1, 21, 0, Math.PI * 2);
    context.arc(0, -12, 20, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#75aa58";
    context.beginPath();
    context.arc(-7, -9, 9, 0, Math.PI * 2);
    context.arc(8, -4, 8, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawCoin(time) {
    const pulse = Math.sin(time * 5) * 2;
    const radius = 13 + pulse * 0.35;
    context.save();
    context.translate(coin.x, coin.y + pulse);
    context.fillStyle = "#74592830";
    context.beginPath();
    context.ellipse(2, radius + 7, 13, 4, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e5a928";
    context.beginPath();
    context.arc(0, 0, radius + 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffd957";
    context.beginPath();
    context.arc(0, -1, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#fff2a5";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, -1, radius - 4, -0.9, 1.1);
    context.stroke();
    context.fillStyle = "#bf8417";
    context.font = "bold 13px Georgia";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("¢", 0, 0);
    context.fillStyle = "#fff8d0";
    context.beginPath();
    context.arc(-4, -6, 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawPlayer(time) {
    if (invulnerableFor > 0 && Math.floor(time * 13) % 2 === 0) return;
    context.save();
    context.translate(player.x, player.y);
    context.scale(player.facing, 1);
    context.fillStyle = "#35574338";
    context.beginPath();
    context.ellipse(0, 17, 19, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e98562";
    context.beginPath();
    context.ellipse(0, 1, 17, 18, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f5a078";
    context.beginPath();
    context.ellipse(-3, -5, 11, 10, -0.2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff9e8";
    context.beginPath();
    context.ellipse(4, -1, 4, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#294234";
    context.beginPath();
    context.arc(5, 0, 2.2, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#8b493d";
    context.lineWidth = 1.8;
    context.beginPath();
    context.arc(6, 5, 4, 0.2, 1.5);
    context.stroke();
    context.fillStyle = "#588a50";
    context.beginPath();
    context.ellipse(-1, -15, 13, 5, -0.1, Math.PI, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f5c54d";
    context.beginPath();
    context.arc(-1, -19, 3.5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawEnemy(enemy) {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.fillStyle = "#3f664331";
    context.beginPath();
    context.ellipse(0, 13, 19, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e47760";
    context.beginPath();
    context.moveTo(-17, 9);
    context.bezierCurveTo(-20, -4, -13, -17, 0, -17);
    context.bezierCurveTo(13, -17, 20, -4, 17, 9);
    context.quadraticCurveTo(0, 17, -17, 9);
    context.fill();
    context.fillStyle = "#f59473";
    context.beginPath();
    context.ellipse(-4, -9, 8, 5, -0.3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff4df";
    context.beginPath();
    context.arc(-5, 0, 3.2, 0, Math.PI * 2);
    context.arc(6, 0, 3.2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#463c35";
    context.beginPath();
    context.arc(-4, 1, 1.5, 0, Math.PI * 2);
    context.arc(7, 1, 1.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#87443e";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-3, 8);
    context.lineTo(4, 8);
    context.stroke();
    context.restore();
  }

  function drawParticles() {
    particles.forEach((particle) => {
      context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
    });
  }

  function draw() {
    if (!context) return;
    drawWorld();
    drawCoin(elapsed);
    enemies.forEach(drawEnemy);
    drawPlayer(elapsed);
    drawParticles();
  }

  function randomOpenPosition(minDistance = 90) {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const point = {
        x: random(45, WORLD_WIDTH - 45),
        y: random(45, WORLD_HEIGHT - 45),
      };
      const clearOfPlayer =
        Math.hypot(point.x - player.x, point.y - player.y) > minDistance;
      const clearOfEnemies = enemies.every(
        (enemy) => Math.hypot(point.x - enemy.x, point.y - enemy.y) > 55,
      );
      if (clearOfPlayer && clearOfEnemies) return point;
    }
    return {
      x: random(45, WORLD_WIDTH - 45),
      y: random(45, WORLD_HEIGHT - 45),
    };
  }

  function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    const point =
      side === 0
        ? { x: 35, y: random(50, 550) }
        : side === 1
          ? { x: 925, y: random(50, 550) }
          : side === 2
            ? { x: random(50, 910), y: 35 }
            : { x: random(50, 910), y: 565 };
    const angle =
      Math.atan2(player.y - point.y, player.x - point.x) + random(-0.65, 0.65);
    const speed = 63 + Math.min(score * 0.22, 58) + random(0, 16);
    enemies.push({
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 17,
      wobble: random(0, Math.PI * 2),
    });
  }

  function updateHud() {
    scoreElement.textContent = String(score);
    timerElement.textContent = String(Math.max(0, Math.ceil(60 - elapsed)));
    livesElement.textContent = `${"♥ ".repeat(lives).trim()}${lives < 3 ? ` ${"♡ ".repeat(3 - lives).trim()}` : ""}`;
    livesElement.setAttribute(
      "aria-label",
      `${lives} ${lives === 1 ? "life" : "lives"}`,
    );
    timerWrap.classList.toggle("is-low", 60 - elapsed <= 10);
  }

  function setScreen(screen) {
    [
      [startScreen, "title"],
      [pauseScreen, "paused"],
      [overScreen, "over"],
    ].forEach(([element, screenState]) => {
      const visible = screen === screenState;
      element.classList.toggle("hidden", !visible);
      element.setAttribute("aria-hidden", String(!visible));
    });
  }

  function playTone(frequency, duration, type = "sine") {
    if (!soundEnabled) return;
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(0.075, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration,
      );
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {
      /* Audio is optional and may be blocked by the browser. */
    }
  }

  function burst(x, y, color, count = 10) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = random(45, 145);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: random(2, 4),
        color,
        life: 0.55,
        maxLife: 0.55,
      });
    }
  }

  function resetGame() {
    cancelAnimationFrame(animationId);
    animationId = 0;
    elapsed = 0;
    score = 0;
    lives = 3;
    invulnerableFor = 0;
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    player.facing = 1;
    enemies = [];
    particles.length = 0;
    coin = randomOpenPosition(120);
    keys.clear();
    heldDirections.clear();
    updateHud();
  }

  function startGame() {
    resetGame();
    state = "playing";
    setScreen("none");
    pauseButton.disabled = false;
    pauseIcon.textContent = "Ⅱ";
    pauseButton.setAttribute("aria-label", "Pause game");
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(gameFrame);
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    cancelAnimationFrame(animationId);
    animationId = 0;
    keys.clear();
    heldDirections.clear();
    setScreen("paused");
    pauseIcon.textContent = "▶";
    pauseButton.setAttribute("aria-label", "Resume game");
    draw();
  }

  function resumeGame() {
    if (state !== "paused") return;
    state = "playing";
    setScreen("none");
    pauseIcon.textContent = "Ⅱ";
    pauseButton.setAttribute("aria-label", "Pause game");
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(gameFrame);
  }

  function endGame(reason) {
    if (state !== "playing") return;
    state = "over";
    cancelAnimationFrame(animationId);
    animationId = 0;
    pauseButton.disabled = true;
    document.getElementById("final-score").textContent = String(score);
    document.getElementById("over-eyebrow").textContent =
      reason === "time"
        ? "TIME FOR A WELL-EARNED REST"
        : "THE MEADOW SAYS WELL PLAYED";
    document.getElementById("over-title").textContent =
      reason === "time"
        ? "Time is up!"
        : lives === 0
          ? "So close!"
          : "Lovely run!";
    if (score > bestScore) {
      bestScore = score;
      bestElement.textContent = String(bestScore);
      saveBestScore();
      document.getElementById("best-message").textContent =
        "A new personal best! Brilliant.";
    } else {
      document.getElementById("best-message").textContent =
        `Personal best: ${bestScore}`;
    }
    setScreen("over");
    draw();
    keys.clear();
    heldDirections.clear();
  }

  function getMovement() {
    let x = 0;
    let y = 0;
    if (keys.has("arrowleft") || keys.has("a") || heldDirections.has("left"))
      x -= 1;
    if (keys.has("arrowright") || keys.has("d") || heldDirections.has("right"))
      x += 1;
    if (keys.has("arrowup") || keys.has("w") || heldDirections.has("up"))
      y -= 1;
    if (keys.has("arrowdown") || keys.has("s") || heldDirections.has("down"))
      y += 1;
    const magnitude = Math.hypot(x, y) || 1;
    return { x: x / magnitude, y: y / magnitude };
  }

  function update(delta) {
    elapsed += delta;
    if (elapsed >= 60) {
      elapsed = 60;
      updateHud();
      endGame("time");
      return;
    }

    invulnerableFor = Math.max(0, invulnerableFor - delta);
    const movement = getMovement();
    player.x = Math.max(
      player.radius + 3,
      Math.min(
        WORLD_WIDTH - player.radius - 3,
        player.x + movement.x * player.speed * delta,
      ),
    );
    player.y = Math.max(
      player.radius + 3,
      Math.min(
        WORLD_HEIGHT - player.radius - 3,
        player.y + movement.y * player.speed * delta,
      ),
    );
    if (movement.x !== 0) player.facing = movement.x > 0 ? 1 : -1;

    const enemyLimit = Math.min(2 + Math.floor(score / 50), 7);
    while (enemies.length < enemyLimit) spawnEnemy();
    enemies.forEach((enemy) => {
      enemy.x += enemy.vx * delta;
      enemy.y += enemy.vy * delta;
      enemy.wobble += delta * 6;
      if (enemy.x < enemy.radius || enemy.x > WORLD_WIDTH - enemy.radius)
        enemy.vx *= -1;
      if (enemy.y < enemy.radius || enemy.y > WORLD_HEIGHT - enemy.radius)
        enemy.vy *= -1;
      enemy.x = Math.max(
        enemy.radius,
        Math.min(WORLD_WIDTH - enemy.radius, enemy.x),
      );
      enemy.y = Math.max(
        enemy.radius,
        Math.min(WORLD_HEIGHT - enemy.radius, enemy.y),
      );
    });

    if (Math.hypot(player.x - coin.x, player.y - coin.y) < player.radius + 13) {
      score += 10;
      burst(coin.x, coin.y, "#ffe16e", 14);
      playTone(700, 0.09);
      playTone(980, 0.13);
      coin = randomOpenPosition(110);
    }

    if (invulnerableFor <= 0) {
      const collidedEnemy = enemies.find(
        (enemy) =>
          Math.hypot(player.x - enemy.x, player.y - enemy.y) <
          player.radius + enemy.radius - 3,
      );
      if (collidedEnemy) {
        lives -= 1;
        invulnerableFor = 1.45;
        burst(player.x, player.y, "#f47a68", 12);
        playTone(170, 0.22, "triangle");
        const angle = Math.atan2(
          player.y - collidedEnemy.y,
          player.x - collidedEnemy.x,
        );
        player.x = Math.max(
          player.radius + 3,
          Math.min(
            WORLD_WIDTH - player.radius - 3,
            player.x + Math.cos(angle) * 42,
          ),
        );
        player.y = Math.max(
          player.radius + 3,
          Math.min(
            WORLD_HEIGHT - player.radius - 3,
            player.y + Math.sin(angle) * 42,
          ),
        );
        if (lives <= 0) {
          updateHud();
          endGame("lives");
          return;
        }
      }
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= 0.97;
      particle.vy *= 0.97;
      particle.life -= delta;
      if (particle.life <= 0) particles.splice(index, 1);
    }
    updateHud();
  }

  function gameFrame(now) {
    if (state !== "playing") return;
    const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;
    update(delta);
    draw();
    if (state === "playing") animationId = requestAnimationFrame(gameFrame);
  }

  document.getElementById("start-button").addEventListener("click", startGame);
  document
    .getElementById("restart-button")
    .addEventListener("click", startGame);
  document
    .getElementById("resume-button")
    .addEventListener("click", resumeGame);
  pauseButton.addEventListener("click", () =>
    state === "playing" ? pauseGame() : resumeGame(),
  );

  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? "♫" : "♪̸";
    soundButton.setAttribute(
      "aria-label",
      soundEnabled ? "Turn sound off" : "Turn sound on",
    );
    soundButton.title = soundEnabled ? "Turn sound off" : "Turn sound on";
    if (soundEnabled) playTone(520, 0.08);
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key))
      event.preventDefault();
    if (key === "escape" && !event.repeat) {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
      return;
    }
    if (
      state === "playing" &&
      [
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
        "w",
        "a",
        "s",
        "d",
      ].includes(key)
    )
      keys.add(key);
  });

  window.addEventListener("keyup", (event) =>
    keys.delete(event.key.toLowerCase()),
  );
  window.addEventListener("blur", () => {
    keys.clear();
    heldDirections.clear();
  });

  document.querySelectorAll(".direction-button").forEach((button) => {
    const direction = button.dataset.direction;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (state !== "playing") return;
      button.setPointerCapture(event.pointerId);
      heldDirections.add(direction);
      button.classList.add("is-pressed");
    });
    const release = () => {
      heldDirections.delete(direction);
      button.classList.remove("is-pressed");
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") pauseGame();
  });
  window.addEventListener("resize", resizeCanvas);

  createDecorations();
  updateHud();
  resizeCanvas();
})();
