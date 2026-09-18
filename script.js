/**
 * Carol & Pipoca ✨ O Pet Fada Mágico
 * Engine interativa: Física suave, Partículas em Canvas, Cuidados & Síntese de Áudio
 */

(() => {
  'use strict';

  /* =========================================================
     Configurações & Estado da Aplicação
     ========================================================= */
  const state = {
    // Nomes
    petName: localStorage.getItem('pet_name') || 'Pipoca',
    ownerName: localStorage.getItem('owner_name') || 'Carol',
    
    // Status do Pet (0 - 100)
    happiness: 95,
    energy: 90,
    hunger: 85,
    
    // Modo atual: 'follow' | 'pet' | 'feed' | 'bubbles' | 'sleep' | 'aura'
    mode: 'follow',
    
    // Auras: 'rainbow' | 'gold' | 'pink' | 'cyan'
    currentAura: 'rainbow',
    auras: ['rainbow', 'gold', 'pink', 'cyan'],
    
    // Tema
    theme: localStorage.getItem('pet_theme') || 'garden',
    
    // Áudio
    soundEnabled: localStorage.getItem('pet_sound') !== 'false',
    
    // Controle do Pet
    pet: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      angle: 0,
      facing: 1, // 1: direita, -1: esquerda
      isIdle: true,
      isSleeping: false,
      isEating: false,
      isHappy: false,
      idleTimer: 0,
      floatTime: 0,
      overrideTarget: null // Para quando for comer doce ou estourar bolha
    },
    
    // Mouse / Touch
    pointer: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      isActive: false
    }
  };

  /* =========================================================
     Elementos DOM
     ========================================================= */
  const DOM = {
    body: document.body,
    canvas: document.getElementById('magic-canvas'),
    petContainer: document.getElementById('pet-container'),
    petSpriteWrapper: document.getElementById('pet-sprite-wrapper'),
    petSprite: document.getElementById('pet-sprite'),
    petAura: document.getElementById('pet-aura'),
    speechBubble: document.getElementById('speech-bubble'),
    speechText: document.getElementById('speech-text'),
    cloudNest: document.getElementById('cloud-nest'),
    sleepZzz: document.getElementById('sleep-zzz'),
    
    // Top HUD
    petNameDisplay: document.getElementById('pet-name-display'),
    barHappiness: document.getElementById('bar-happiness'),
    barEnergy: document.getElementById('bar-energy'),
    barHunger: document.getElementById('bar-hunger'),
    btnRename: document.getElementById('btn-rename'),
    btnTheme: document.getElementById('btn-theme'),
    themeIcon: document.getElementById('theme-icon'),
    themeLabel: document.getElementById('theme-label'),
    btnSound: document.getElementById('btn-sound'),
    soundIcon: document.getElementById('sound-icon'),
    soundLabel: document.getElementById('sound-label'),
    btnGithubHelp: document.getElementById('btn-github-help'),
    quickHint: document.getElementById('quick-hint'),
    
    // Dock Buttons
    actFollow: document.getElementById('act-follow'),
    actPet: document.getElementById('act-pet'),
    actFeed: document.getElementById('act-feed'),
    actBubbles: document.getElementById('act-bubbles'),
    actSleep: document.getElementById('act-sleep'),
    actAura: document.getElementById('act-aura'),
    dockButtons: document.querySelectorAll('.dock-btn'),
    
    // Modais
    modalGithub: document.getElementById('modal-github'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnModalOk: document.getElementById('btn-modal-ok'),
    
    modalRename: document.getElementById('modal-rename'),
    btnCloseRename: document.getElementById('btn-close-rename'),
    btnSaveRename: document.getElementById('btn-save-rename'),
    inputPetName: document.getElementById('input-pet-name'),
    inputOwnerName: document.getElementById('input-owner-name')
  };

  /* =========================================================
     Sprites Pré-carregados
     ========================================================= */
  const SPRITES = {
    fly: './assets/pet_fly.png',
    happy: './assets/pet_happy.png',
    sleep: './assets/pet_sleep.png',
    snack: './assets/pet_snack.png'
  };

  // Pré-carregamento no browser
  Object.values(SPRITES).forEach(src => {
    const img = new Image();
    img.src = src;
  });

  /* =========================================================
     Sintetizador de Áudio Encantado (Web Audio API)
     Zero arquivos externos - Sons cristalinos gerados via código
     ========================================================= */
  class MagicAudio {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Toca um sino celestial de fada
    playChime(freq = 659.25, duration = 0.5) { // E5 default
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration * 0.3);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    // Arpeggio mágico ao receber carinho
    playLoveChime() {
      if (!state.soundEnabled) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => this.playChime(freq, 0.4), i * 90);
      });
    }

    // Som fofo de mastigação/mordidinha estelar
    playEatSound() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(f * 0.8, this.ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.1);
        }, idx * 120);
      });
    }

    // Som cristalino de estouro de bolha
    playPopSound() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    // Melodia relaxante de ninar para dormir
    playLullaby() {
      if (!state.soundEnabled) return;
      const chords = [392, 440, 493.88, 587.33, 659.25];
      chords.forEach((note, i) => {
        setTimeout(() => this.playChime(note, 0.7), i * 180);
      });
    }
  }

  const audio = new MagicAudio();

  /* =========================================================
     Sistema de Partículas em Canvas (60 FPS)
     ========================================================= */
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.ambientStars = [];
      this.resize();

      window.addEventListener('resize', () => this.resize());
      this.initAmbient();
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    initAmbient() {
      this.ambientStars = [];
      const count = Math.floor((this.width * this.height) / 25000);
      for (let i = 0; i < count; i++) {
        this.ambientStars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 2 + 0.8,
          alpha: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.02 + 0.01,
          color: ['#ffd166', '#ffcbf2', '#70d6ff', '#ffffff'][Math.floor(Math.random() * 4)]
        });
      }
    }

    // Rastro de poeira de fada soltado nas asas do pet
    emitStardust(x, y, facing) {
      // Pequeno deslocamento atrás do pet de acordo com a direção
      const offsetX = x - (facing * 20) + (Math.random() - 0.5) * 30;
      const offsetY = y + (Math.random() - 0.5) * 35;
      const colors = ['#ffd166', '#ff9ebb', '#70d6ff', '#c77dff', '#ffffff'];

      this.particles.push({
        x: offsetX,
        y: offsetY,
        vx: -(facing * (Math.random() * 1.5 + 0.5)),
        vy: (Math.random() - 0.5) * 1.2 + 0.3,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.018,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.6 ? 'star' : 'orb'
      });
    }

    // Explosão de corações ao receber carinho
    burstHearts(x, y) {
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.5 + 1.5;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1.2, // flutua para cima
          size: Math.random() * 12 + 10,
          life: 1.0,
          decay: 0.02,
          color: ['#ff758c', '#ff7eb3', '#ffcbf2', '#ff5964'][Math.floor(Math.random() * 4)],
          type: 'heart'
        });
      }
    }

    // Explosão estelar ao comer ou estourar bolha
    burstSparkles(x, y, color = '#ffd166') {
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const spd = Math.random() * 4 + 2;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 5 + 2,
          life: 1.0,
          decay: 0.03,
          color: color,
          type: 'star'
        });
      }
    }

    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. Estrelas & Vaga-lumes de fundo
      const time = performance.now() * 0.002;
      for (let star of this.ambientStars) {
        const twinkle = Math.sin(time * star.speed * 100 + star.x) * 0.35 + 0.65;
        this.ctx.beginPath();
        this.ctx.fillStyle = star.color;
        this.ctx.globalAlpha = star.alpha * twinkle;
        this.ctx.arc(star.x, star.y, star.radius * twinkle, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // 2. Partículas Dinâmicas
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.life);

        if (p.type === 'heart') {
          // Desenhar coração
          this.ctx.fillStyle = p.color;
          this.ctx.font = `${p.size}px sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText('💖', p.x, p.y);
        } else if (p.type === 'star') {
          // Estrela pontuda brilhante
          this.ctx.fillStyle = p.color;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = p.color;
          this.drawStar(p.x, p.y, 4, p.size, p.size * 0.4);
        } else {
          // Orbe suave
          this.ctx.beginPath();
          this.ctx.fillStyle = p.color;
          this.ctx.shadowBlur = 6;
          this.ctx.shadowColor = p.color;
          this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        this.ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        this.ctx.lineTo(x, y);
        rot += step;
      }
      this.ctx.lineTo(cx, cy - outerRadius);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  const particles = new ParticleSystem(DOM.canvas);

  /* =========================================================
     Banco de Diálogos & Frases da Fada em PT-BR
     ========================================================= */
  const DIALOGS = {
    greetings: [
      () => `Oie, ${state.ownerName}! Vamos voar juntinhos hoje? ✨`,
      () => `Que dia lindo, ${state.ownerName}! Minhas asas estão prontas! 🌸`,
      () => `Você é minha tutora favorita do universo inteiro! 💖`,
      () => `Pronta pra espalhar pó de pirlimpimpim? 🪄`
    ],
    moving: [
      () => `Segurando firme na sua cauda de cometa! 💨`,
      () => `Uhuuuul! Que curva rápida, ${state.ownerName}! ✨`,
      () => `Para onde estamos indo agora? Me leva! 🌈`,
      () => `Voar ao seu lado é pura magia!`
    ],
    petting: [
      () => `Aaaah que cafuné gostoso! Purrrrr... 🥰`,
      () => `Meu coração fica todo quentinho, ${state.ownerName}! 💖`,
      () => `Mais carinho, por favoooor! É tão bom! ✨`,
      () => `Olha as minhas asinhas tremelicando de alegria! 🦋`
    ],
    feeding: [
      () => `Nham nham! Que estrelinha mais saborosa! ⭐😋`,
      () => `Comidinha cósmica é a minha favorita! 🧁✨`,
      () => `Barriguinha cheia, fada feliz! Obrigada, ${state.ownerName}! 💖`,
      () => `Doces de poeira lunar dão tanta energia! ⚡`
    ],
    bubbles: [
      () => `Plop! Estourei mais uma bolha! 🫧✨`,
      () => `Essa bolha quase me pegou! Que divertido! 🎈`,
      () => `Olha o arco-íris refletindo na água! 🌈`,
      () => `Manda mais bolhas, ${state.ownerName}! 🪄`
    ],
    sleep: [
      () => `Zzz... sonhando com nuvens de marshmallow... 🌙`,
      () => `Boa noite, ${state.ownerName}... até amanhã nos meus sonhos... ✨`,
      () => `Quentinho no ninho... recarregando as asinhas... 💤`
    ],
    wake: [
      () => `*Bocejo de fada* Que soninho bom! Prontinha pra voar! ✨`,
      () => `Bom dia flor do dia! Tô cheia de energia, ${state.ownerName}! ⚡💖`
    ],
    needFood: [
      () => `Minha barriguinha tá roncando estrelas... me dá um docinho? 🧁`,
      () => `Uma frutinha celestial agora seria tão perfeita... ⭐`
    ]
  };

  let speechTimeout = null;

  function speak(text, duration = 4000) {
    if (speechTimeout) clearTimeout(speechTimeout);
    DOM.speechText.textContent = text;
    DOM.speechBubble.classList.add('active');

    speechTimeout = setTimeout(() => {
      DOM.speechBubble.classList.remove('active');
    }, duration);
  }

  function randomSpeak(category) {
    const list = DIALOGS[category];
    if (list && list.length > 0) {
      const fn = list[Math.floor(Math.random() * list.length)];
      speak(fn());
    }
  }

  /* =========================================================
     Atualização de Status & Vitals (Tamagotchi)
     ========================================================= */
  function updateVitalsUI() {
    DOM.barHappiness.style.width = `${Math.min(100, Math.max(5, state.happiness))}%`;
    DOM.barEnergy.style.width = `${Math.min(100, Math.max(5, state.energy))}%`;
    DOM.barHunger.style.width = `${Math.min(100, Math.max(5, state.hunger))}%`;
  }

  // Declínio natural lento dos atributos
  setInterval(() => {
    if (state.pet.isSleeping) {
      // Dormindo: recarrega energia
      state.energy = Math.min(100, state.energy + 5);
      state.hunger = Math.max(10, state.hunger - 0.5);
    } else {
      state.energy = Math.max(10, state.energy - 0.8);
      state.hunger = Math.max(10, state.hunger - 1.0);
      state.happiness = Math.max(10, state.happiness - 0.5);

      // Aviso fofo de fome
      if (state.hunger < 30 && Math.random() < 0.3) {
        randomSpeak('needFood');
      }
    }
    updateVitalsUI();
  }, 10000);

  /* =========================================================
     Física e Movimento do Pet Seguidor
     ========================================================= */
  const PET_CONFIG = {
    spring: 0.055,       // Agilidade de seguimento
    friction: 0.82,      // Suavidade da inércia
    maxTilt: 22,         // Inclinação máxima nas curvas (graus)
    idleDistance: 35     // Distância para considerar que chegou
  };

  function updatePetPhysics() {
    const pet = state.pet;

    // Se estiver dormindo, o destino fixo é o ninho de nuvens
    if (pet.isSleeping) {
      const nestRect = DOM.cloudNest.getBoundingClientRect();
      pet.targetX = nestRect.left + nestRect.width / 2;
      pet.targetY = nestRect.top + nestRect.height / 2 - 15;
    } else if (pet.overrideTarget) {
      // Destino temporário (ir até uma comidinha ou bolha)
      pet.targetX = pet.overrideTarget.x;
      pet.targetY = pet.overrideTarget.y;
    } else {
      // Seguir o cursor / toque do usuário
      pet.targetX = state.pointer.x;
      pet.targetY = state.pointer.y;
    }

    // Cálculo da distância até o alvo
    const dx = pet.targetX - pet.x;
    const dy = pet.targetY - pet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Aplicação da força de aceleração suave em direção ao alvo
    if (distance > 5) {
      pet.vx += dx * PET_CONFIG.spring;
      pet.vy += dy * PET_CONFIG.spring;
    }

    // Aplicação de atrito/amortecimento inercial
    pet.vx *= PET_CONFIG.friction;
    pet.vy *= PET_CONFIG.friction;

    // Atualização de posição
    pet.x += pet.vx;
    pet.y += pet.vy;

    // Velocidade escalar atual
    pet.speed = Math.sqrt(pet.vx * pet.vx + pet.vy * pet.vy);

    // Orientação de virada (flip horizontal)
    if (Math.abs(pet.vx) > 0.4) {
      pet.facing = pet.vx > 0 ? 1 : -1;
    }

    // Inclinação dinâmica (banking) com limite
    const targetTilt = Math.max(-PET_CONFIG.maxTilt, Math.min(PET_CONFIG.maxTilt, pet.vx * 1.5));
    pet.angle += (targetTilt - pet.angle) * 0.15;

    // Flutuação harmônica (idle bobbing)
    pet.floatTime += 0.04;
    const floatOffset = pet.isSleeping ? 0 : Math.sin(pet.floatTime) * 8;

    // Emitir partículas de brilho nas asas se estiver em movimento
    if (pet.speed > 1.2 && !pet.isSleeping) {
      particles.emitStardust(pet.x, pet.y + floatOffset, pet.facing);

      // Tocar som de sininho suave se mover rápido
      if (pet.speed > 8 && Math.random() < 0.08) {
        audio.playChime(784, 0.2);
      }
    }

    // Classes visuais no elemento do pet
    if (pet.speed > 1.5) {
      DOM.petContainer.classList.add('moving');
      DOM.petContainer.classList.remove('idle');
      pet.idleTimer = 0;
    } else {
      DOM.petContainer.classList.remove('moving');
      DOM.petContainer.classList.add('idle');
      pet.idleTimer++;

      // Frases espontâneas de vez em quando se ficar parado
      if (pet.idleTimer === 240 && !pet.isSleeping && Math.random() < 0.6) {
        randomSpeak('greetings');
      }
    }

    // Aplicação de transform GPU acelerado
    DOM.petContainer.style.transform = `translate3d(${pet.x}px, ${pet.y + floatOffset}px, 0) scaleX(${pet.facing}) rotate(${pet.angle * pet.facing}deg)`;

    // Checagem se alcançou o alvo temporário (doce ou bolha)
    if (pet.overrideTarget && distance < PET_CONFIG.idleDistance) {
      if (pet.overrideTarget.onReach) {
        pet.overrideTarget.onReach();
      }
      pet.overrideTarget = null;
    }
  }

  /* =========================================================
     Interações: Carinho, Alimentar, Brincar & Dormir
     ========================================================= */

  // 1. Fazer Carinho
  function triggerPetting() {
    if (state.pet.isSleeping) {
      wakeUpPet();
      return;
    }

    state.pet.isHappy = true;
    DOM.petSprite.src = SPRITES.happy;
    DOM.petContainer.classList.add('happy');

    // Efeitos
    particles.burstHearts(state.pet.x, state.pet.y);
    audio.playLoveChime();

    // Aumentar felicidade
    state.happiness = Math.min(100, state.happiness + 8);
    updateVitalsUI();

    // Falar frase fofa
    randomSpeak('petting');

    setTimeout(() => {
      if (!state.pet.isSleeping && !state.pet.isEating) {
        DOM.petSprite.src = SPRITES.fly;
        DOM.petContainer.classList.remove('happy');
      }
    }, 2000);
  }

  // 2. Jogar Comidinha Mágica
  const SNACK_EMOJIS = ['⭐', '🧁', '🍓', '🍰', '🍪', '🍬'];

  function dropSnack(x, y) {
    if (state.pet.isSleeping) {
      wakeUpPet();
    }

    const snackEl = document.createElement('div');
    snackEl.className = 'magic-snack';
    snackEl.textContent = SNACK_EMOJIS[Math.floor(Math.random() * SNACK_EMOJIS.length)];
    snackEl.style.left = `${x}px`;
    snackEl.style.top = `${y}px`;
    DOM.body.appendChild(snackEl);

    audio.playChime(880, 0.15);

    // Faz o pet voar diretamente até o docinho
    state.pet.overrideTarget = {
      x: x,
      y: y,
      onReach: () => {
        // Chegou no docinho!
        state.pet.isEating = true;
        DOM.petSprite.src = SPRITES.snack;
        particles.burstSparkles(x, y, '#ffd166');
        audio.playEatSound();

        // Encher fome e felicidade
        state.hunger = Math.min(100, state.hunger + 25);
        state.happiness = Math.min(100, state.happiness + 5);
        updateVitalsUI();

        // Remover doce da tela
        if (snackEl.parentNode) {
          snackEl.parentNode.removeChild(snackEl);
        }

        randomSpeak('feeding');

        // Volta ao normal após saborear
        setTimeout(() => {
          state.pet.isEating = false;
          if (!state.pet.isSleeping) {
            DOM.petSprite.src = SPRITES.fly;
          }
        }, 2200);
      }
    };
  }

  // 3. Brincar de Bolhas Mágicas
  function spawnBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'magic-bubble';
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    DOM.body.appendChild(bubble);

    // Movimento suave de subida flutuante
    let bubbleX = x;
    let bubbleY = y;
    let speedY = Math.random() * 0.8 + 0.5;
    let wobble = Math.random() * 10;

    const interval = setInterval(() => {
      bubbleY -= speedY;
      wobble += 0.05;
      bubble.style.top = `${bubbleY}px`;
      bubble.style.left = `${bubbleX + Math.sin(wobble) * 20}px`;

      // Se sair pelo topo da tela, remove
      if (bubbleY < -60) {
        clearInterval(interval);
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      }
    }, 30);

    const popBubble = () => {
      clearInterval(interval);
      particles.burstSparkles(bubbleX, bubbleY, '#70d6ff');
      audio.playPopSound();
      state.happiness = Math.min(100, state.happiness + 3);
      updateVitalsUI();

      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      randomSpeak('bubbles');
    };

    bubble.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      popBubble();
    });

    // Se o pet estiver livre, direciona-o para a bolha
    if (!state.pet.overrideTarget && !state.pet.isSleeping) {
      state.pet.overrideTarget = {
        x: bubbleX,
        y: bubbleY,
        onReach: popBubble
      };
    }
  }

  function spawnBubbleShower() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const randX = Math.random() * (window.innerWidth - 160) + 80;
        const randY = window.innerHeight - 100 - (Math.random() * 150);
        spawnBubble(randX, randY);
      }, i * 350);
    }
    speak('Uau! Olha quantas bolhas cintilantes! Vamos estourar! 🫧✨');
  }

  // 4. Modo Soneca / Ninho
  function putPetToSleep() {
    state.pet.isSleeping = true;
    DOM.petSprite.src = SPRITES.sleep;
    DOM.petContainer.classList.add('sleeping');
    DOM.cloudNest.classList.add('visible');

    audio.playLullaby();
    randomSpeak('sleep');
    DOM.quickHint.textContent = '🌙 Zzz... O pet está descansando no ninho de nuvens. Clique nele para acordar!';
  }

  function wakeUpPet() {
    state.pet.isSleeping = false;
    DOM.petSprite.src = SPRITES.fly;
    DOM.petContainer.classList.remove('sleeping');
    DOM.cloudNest.classList.remove('visible');

    audio.playChime(1046.50, 0.4);
    randomSpeak('wake');
    DOM.quickHint.textContent = '✨ Mexa o mouse ou arraste o dedo: o pet voa com você!';
    setMode('follow');
  }

  // 5. Mudar Cor da Aura
  function cycleAura() {
    const currentIdx = state.auras.indexOf(state.currentAura);
    const nextIdx = (currentIdx + 1) % state.auras.length;
    state.currentAura = state.auras[nextIdx];

    // Atualiza classes
    state.auras.forEach(a => DOM.petAura.classList.remove(`aura-${a}`));
    DOM.petAura.classList.add(`aura-${state.currentAura}`);

    audio.playChime(880, 0.25);
    particles.burstSparkles(state.pet.x, state.pet.y, '#c77dff');

    const auraNames = {
      rainbow: 'Arco-íris Mágico 🌈',
      gold: 'Estrela Dourada ⭐',
      pink: 'Coração de Fada 💖',
      cyan: 'Aurora Celeste ❄️'
    };
    speak(`Aura alterada para: ${auraNames[state.currentAura]}! ✨`, 2500);
  }

  /* =========================================================
     Gestão de Modos no Dock Inferior
     ========================================================= */
  function setMode(newMode) {
    state.mode = newMode;
    DOM.dockButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    if (newMode === 'sleep') {
      putPetToSleep();
    } else if (state.pet.isSleeping && newMode !== 'sleep') {
      wakeUpPet();
    }

    if (newMode === 'follow') {
      DOM.quickHint.textContent = '✨ Mexa o mouse ou arraste o dedo: o pet voa com você!';
    } else if (newMode === 'pet') {
      DOM.quickHint.textContent = '💖 Clique no pet ou passe o mouse rápido nele para dar carinho!';
      triggerPetting();
    } else if (newMode === 'feed') {
      DOM.quickHint.textContent = '🧁 Clique em qualquer lugar da tela para jogar estrelinhas e doces!';
    } else if (newMode === 'bubbles') {
      DOM.quickHint.textContent = '🫧 Estoure as bolhas mágicas na tela!';
      spawnBubbleShower();
    } else if (newMode === 'aura') {
      cycleAura();
    }
  }

  /* =========================================================
     Alternar Tema (Jardim Encantado / Noite Estelar)
     ========================================================= */
  function toggleTheme() {
    state.theme = state.theme === 'garden' ? 'night' : 'garden';
    localStorage.setItem('pet_theme', state.theme);

    if (state.theme === 'garden') {
      DOM.body.className = 'theme-garden';
      DOM.themeIcon.textContent = '🌸';
      DOM.themeLabel.textContent = 'Jardim';
      speak('Bem-vindos ao Jardim Encantado! 🌸✨');
    } else {
      DOM.body.className = 'theme-night';
      DOM.themeIcon.textContent = '🌌';
      DOM.themeLabel.textContent = 'Noite';
      speak('Olha as estrelas e a aurora boreal! Que lindo! 🌌✨');
    }
    audio.playChime(659.25, 0.3);
  }

  // Inicializa tema salvo
  if (state.theme === 'night') {
    DOM.body.className = 'theme-night';
    DOM.themeIcon.textContent = '🌌';
    DOM.themeLabel.textContent = 'Noite';
  }

  /* =========================================================
     Alternar Som
     ========================================================= */
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('pet_sound', state.soundEnabled);

    if (state.soundEnabled) {
      DOM.soundIcon.textContent = '🔊';
      DOM.soundLabel.textContent = 'Som';
      audio.init();
      audio.playChime(784, 0.3);
      speak('Sons mágicos ativados! 🎶✨', 2000);
    } else {
      DOM.soundIcon.textContent = '🔇';
      DOM.soundLabel.textContent = 'Mudo';
    }
  }

  if (!state.soundEnabled) {
    DOM.soundIcon.textContent = '🔇';
    DOM.soundLabel.textContent = 'Mudo';
  }

  /* =========================================================
     Event Listeners: Mouse, Toque e Interações Globais
     ========================================================= */

  // Movimentação do ponteiro (mouse & touch)
  function handlePointerMove(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    state.pointer.x = clientX;
    state.pointer.y = clientY;
    state.pointer.isActive = true;

    // Inicializa áudio na primeira interação se necessário
    audio.init();
  }

  window.addEventListener('mousemove', handlePointerMove, { passive: true });
  window.addEventListener('touchmove', handlePointerMove, { passive: true });

  // Clique na tela / playground
  window.addEventListener('pointerdown', (e) => {
    audio.init();

    // Ignora cliques dentro do HUD, dock ou modais
    if (e.target.closest('.hud-top') || e.target.closest('.hud-dock') || e.target.closest('.modal-card')) {
      return;
    }

    // Se clicar no pet diretamente
    if (e.target.closest('#pet-container')) {
      if (state.pet.isSleeping) {
        wakeUpPet();
      } else {
        triggerPetting();
      }
      return;
    }

    // Se clicar no ninho de nuvens
    if (e.target.closest('#cloud-nest')) {
      if (state.pet.isSleeping) {
        wakeUpPet();
      } else {
        putPetToSleep();
      }
      return;
    }

    // Ações dependentes do modo ativo
    if (state.mode === 'feed') {
      dropSnack(e.clientX, e.clientY);
    } else if (state.mode === 'bubbles') {
      spawnBubble(e.clientX, e.clientY);
    } else if (state.mode === 'follow') {
      // Se clicar no modo follow, emite pequena explosão de pó de pirlimpimpim
      particles.burstSparkles(e.clientX, e.clientY, '#70d6ff');
      audio.playChime(987.77, 0.15);
    }
  });

  // Dock Buttons Click
  DOM.dockButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.init();
      setMode(btn.dataset.mode);
    });
  });

  // Botões de Ação Topo
  DOM.btnTheme.addEventListener('click', toggleTheme);
  DOM.btnSound.addEventListener('click', toggleSound);

  // Modal GitHub Pages
  DOM.btnGithubHelp.addEventListener('click', () => {
    DOM.modalGithub.classList.remove('hidden');
  });

  DOM.btnCloseModal.addEventListener('click', () => {
    DOM.modalGithub.classList.add('hidden');
  });

  DOM.btnModalOk.addEventListener('click', () => {
    DOM.modalGithub.classList.add('hidden');
  });

  // Modal Renomear
  DOM.btnRename.addEventListener('click', () => {
    DOM.inputPetName.value = state.petName;
    DOM.inputOwnerName.value = state.ownerName;
    DOM.modalRename.classList.remove('hidden');
  });

  DOM.btnCloseRename.addEventListener('click', () => {
    DOM.modalRename.classList.add('hidden');
  });

  DOM.btnSaveRename.addEventListener('click', () => {
    const newPet = DOM.inputPetName.value.trim();
    const newOwner = DOM.inputOwnerName.value.trim();

    if (newPet) {
      state.petName = newPet;
      localStorage.setItem('pet_name', newPet);
      DOM.petNameDisplay.textContent = newPet;
    }

    if (newOwner) {
      state.ownerName = newOwner;
      localStorage.setItem('owner_name', newOwner);
    }

    DOM.modalRename.classList.add('hidden');
    audio.playLoveChime();
    speak(`Prazer! Meu nome é ${state.petName} e amo a ${state.ownerName}! ✨💖`);
  });

  // Fechar modais ao clicar fora
  [DOM.modalGithub, DOM.modalRename].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  /* =========================================================
     Loop de Animação Principal (RequestAnimationFrame)
     ========================================================= */
  function gameLoop() {
    updatePetPhysics();
    particles.render();
    requestAnimationFrame(gameLoop);
  }

  // Inicialização
  DOM.petNameDisplay.textContent = state.petName;
  updateVitalsUI();

  // Primeira saudação com pequeno atraso para animação de abertura
  setTimeout(() => {
    randomSpeak('greetings');
  }, 900);

  // Iniciar loop
  requestAnimationFrame(gameLoop);

})();
