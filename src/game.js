const W = 800
const H = 600

const SHIP_W = 36
const SHIP_H = 20
const SHIP_Y = H - 48
const SHIP_SPEED = 3
const BULLET_SPEED = 5
const FIRE_COOLDOWN = 50
const ALIEN_ROWS = 5
const ALIEN_COLS = 11
const ALIEN_W = 34
const ALIEN_H = 26
const ALIEN_PAD_X = 14
const ALIEN_PAD_Y = 12
const ALIEN_OFFSET_TOP = 72

export function createGame(canvas) {
  const ctx = canvas.getContext('2d')

  const keys = new Set()

  let ships
  let aliens
  let playerBullets
  let alienBullets
  let alienDir
  let alienStepDown
  let score
  let lives
  let frame
  let lastAlienShot
  let state
  let animId

  function reset() {
    ships = [
      {
        id: 1,
        x: W * 0.22 - SHIP_W / 2,
        color: '#3ee8d6',
        bulletColor: '#3ee8d6',
        fireCooldown: 0,
      },
      {
        id: 2,
        x: W * 0.78 - SHIP_W / 2,
        color: '#ff4fd8',
        bulletColor: '#ff4fd8',
        fireCooldown: 25,
      },
    ]

    aliens = []
    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        aliens.push({
          x: 56 + col * (ALIEN_W + ALIEN_PAD_X),
          y: ALIEN_OFFSET_TOP + row * (ALIEN_H + ALIEN_PAD_Y),
          alive: true,
          row,
        })
      }
    }

    playerBullets = []
    alienBullets = []
    alienDir = 1
    alienStepDown = false
    score = 0
    lives = 6
    frame = 0
    lastAlienShot = 0
    state = 'playing'
    updateHud()
    hideOverlay()
  }

  function updateHud() {
    document.getElementById('score').textContent = String(score)
    document.getElementById('lives').textContent = String(lives)
  }

  function showOverlay(text) {
    const overlay = document.getElementById('overlay')
    document.getElementById('overlay-text').textContent = text
    overlay.classList.remove('hidden')
  }

  function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden')
  }

  function clampShip(ship) {
    ship.x = Math.max(8, Math.min(W - SHIP_W - 8, ship.x))
  }

  function moveShips() {
    const s1 = ships[0]
    const s2 = ships[1]

    if (keys.has('KeyA')) s1.x -= SHIP_SPEED
    if (keys.has('KeyD')) s1.x += SHIP_SPEED
    if (keys.has('ArrowLeft')) s2.x -= SHIP_SPEED
    if (keys.has('ArrowRight')) s2.x += SHIP_SPEED

    clampShip(s1)
    clampShip(s2)
  }

  function autoFire() {
    for (const ship of ships) {
      if (ship.fireCooldown > 0) {
        ship.fireCooldown -= 1
        continue
      }

      const hasBullet = playerBullets.some((b) => b.shipId === ship.id)
      if (hasBullet) continue

      playerBullets.push({
        x: ship.x + SHIP_W / 2 - 2,
        y: SHIP_Y - 4,
        shipId: ship.id,
        color: ship.bulletColor,
      })
      ship.fireCooldown = FIRE_COOLDOWN
    }
  }

  function updatePlayerBullets() {
    playerBullets = playerBullets.filter((b) => {
      b.y -= BULLET_SPEED
      return b.y > -10
    })
  }

  function updateAliens() {
    const alive = aliens.filter((a) => a.alive)
    if (alive.length === 0) {
      state = 'won'
      showOverlay('You cleared the swarm!\nCo-op victory.')
      return
    }

    let minX = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const a of alive) {
      minX = Math.min(minX, a.x)
      maxX = Math.max(maxX, a.x + ALIEN_W)
      maxY = Math.max(maxY, a.y + ALIEN_H)
    }

    if (maxY >= SHIP_Y - 12) {
      state = 'lost'
      showOverlay('The invaders landed!\nGame over.')
      return
    }

    const speed = 0.55 + (ALIEN_ROWS * ALIEN_COLS - alive.length) * 0.018
    let hitEdge = false

    if (alienStepDown) {
      for (const a of alive) a.y += 10
      alienDir *= -1
      alienStepDown = false
    } else {
      for (const a of alive) a.x += alienDir * speed
      if ((alienDir > 0 && maxX >= W - 40) || (alienDir < 0 && minX <= 40)) {
        hitEdge = true
      }
    }

    if (hitEdge) alienStepDown = true

    frame++
    if (frame % 80 === 0 && Math.random() < 0.45) {
      const shooters = alive.filter(() => Math.random() < 0.35)
      const pool = shooters.length ? shooters : alive
      const shooter = pool[Math.floor(Math.random() * pool.length)]
      alienBullets.push({
        x: shooter.x + ALIEN_W / 2 - 2,
        y: shooter.y + ALIEN_H,
      })
    }
  }

  function updateAlienBullets() {
    alienBullets = alienBullets.filter((b) => {
      b.y += 2.4
      return b.y < H + 10
    })
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  function checkCollisions() {
    for (const bullet of playerBullets) {
      for (const alien of aliens) {
        if (!alien.alive) continue
        if (
          rectsOverlap(
            bullet.x,
            bullet.y,
            4,
            12,
            alien.x,
            alien.y,
            ALIEN_W,
            ALIEN_H
          )
        ) {
          alien.alive = false
          bullet.y = -999
          score += 10 + (ALIEN_ROWS - alien.row) * 2
          updateHud()
        }
      }
    }
    playerBullets = playerBullets.filter((b) => b.y > -50)

    for (const bullet of alienBullets) {
      for (const ship of ships) {
        if (
          rectsOverlap(
            bullet.x,
            bullet.y,
            4,
            10,
            ship.x,
            SHIP_Y,
            SHIP_W,
            SHIP_H
          )
        ) {
          bullet.y = H + 99
          lives -= 1
          updateHud()
          ship.x = ship.id === 1 ? W * 0.22 - SHIP_W / 2 : W * 0.78 - SHIP_W / 2
          if (lives <= 0) {
            state = 'lost'
            showOverlay('Both ships destroyed!\nGame over.')
          }
        }
      }
    }
    alienBullets = alienBullets.filter((b) => b.y < H + 10)
  }

  function drawShip(ship) {
    const x = ship.x
    const y = SHIP_Y
    ctx.fillStyle = ship.color
    ctx.beginPath()
    ctx.moveTo(x + SHIP_W / 2, y)
    ctx.lineTo(x + SHIP_W, y + SHIP_H)
    ctx.lineTo(x, y + SHIP_H)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(x + SHIP_W / 2 - 4, y + 6, 8, 6)
  }

  function drawAlien(alien) {
    if (!alien.alive) return
    const { x, y } = alien
    const hue = alien.row % 2 === 0 ? '#b8ff3c' : '#ffe45c'
    ctx.fillStyle = hue
    ctx.fillRect(x + 6, y, ALIEN_W - 12, ALIEN_H - 8)
    ctx.fillStyle = '#050508'
    ctx.fillRect(x + 10, y + 8, 6, 6)
    ctx.fillRect(x + ALIEN_W - 16, y + 8, 6, 6)
    ctx.fillRect(x + 8, y + ALIEN_H - 10, ALIEN_W - 16, 6)
  }

  function draw() {
    ctx.fillStyle = '#0c1020'
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + (i % 3) * 0.04})`
      ctx.fillRect((i * 97) % W, (i * 53 + frame * 0.3) % H, 2, 2)
    }

    for (const alien of aliens) drawAlien(alien)
    for (const ship of ships) drawShip(ship)

    for (const b of playerBullets) {
      ctx.fillStyle = b.color
      ctx.fillRect(b.x, b.y, 4, 12)
    }

    ctx.fillStyle = '#ff6b4a'
    for (const b of alienBullets) ctx.fillRect(b.x, b.y, 4, 10)

    if (state === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '8px "Press Start 2P"'
      ctx.fillText('CO-OP', W / 2 - 28, 24)
    }
  }

  function tick() {
    if (state === 'playing') {
      moveShips()
      autoFire()
      updatePlayerBullets()
      updateAliens()
      updateAlienBullets()
      checkCollisions()
    }
    draw()
    animId = requestAnimationFrame(tick)
  }

  function onKeyDown(e) {
    if (['ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault()
    }
    keys.add(e.code)
  }

  function onKeyUp(e) {
    keys.delete(e.code)
  }

  function start() {
    reset()
    cancelAnimationFrame(animId)
    animId = requestAnimationFrame(tick)
  }

  function stop() {
    cancelAnimationFrame(animId)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  document.getElementById('restart-btn').addEventListener('click', start)

  start()

  return { start, stop }
}