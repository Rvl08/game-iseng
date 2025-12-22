// Particle System for visual effects

import { BLOCKS } from './constants';

interface ParticleConfig {
  angle: number;
  spread: number;
  speed: number;
  colors: string[];
  life: number;
  size: number;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, life: number, size: number = 2) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.gravity = 0.2;
  }
  
  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
    return this.life > 0;
  }
  
  draw(ctx: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void {
    const alpha = this.life / this.maxLife;
    const screenX = (this.x - camera.x) * camera.zoom;
    const screenY = (this.y - camera.y) * camera.zoom;
    const screenSize = this.size * camera.zoom;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(screenX, screenY, screenSize, screenSize);
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  particles: Particle[] = [];
  
  emit(x: number, y: number, count: number, config: ParticleConfig): void {
    for (let i = 0; i < count; i++) {
      const angle = config.angle + (Math.random() - 0.5) * config.spread;
      const speed = config.speed * (0.5 + Math.random() * 0.5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const life = config.life * (0.5 + Math.random() * 0.5);
      const size = config.size * (0.5 + Math.random() * 0.5);
      
      this.particles.push(new Particle(x, y, vx, vy, color, life, size));
    }
  }
  
  update(): void {
    this.particles = this.particles.filter(p => p.update());
  }
  
  draw(ctx: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void {
    this.particles.forEach(p => p.draw(ctx, camera));
  }
  
  // Preset effects
  explosion(x: number, y: number): void {
    this.emit(x, y, 20, {
      angle: 0,
      spread: Math.PI * 2,
      speed: 5,
      colors: ['#ff3366', '#ff6600', '#ffcc00', '#ffffff'],
      life: 30,
      size: 3,
    });
  }
  
  blockBreak(x: number, y: number, blockType: number): void {
    const colors = blockType === BLOCKS.DIRT 
      ? ['#3d2817', '#5c4030', '#7a5a40']
      : ['#4a4a5a', '#6a6a7a', '#8a8a9a'];
    
    this.emit(x, y, 8, {
      angle: -Math.PI / 2,
      spread: Math.PI,
      speed: 3,
      colors,
      life: 25,
      size: 4,
    });
  }
  
  jump(x: number, y: number): void {
    this.emit(x + 8, y + 16, 5, {
      angle: -Math.PI / 2,
      spread: Math.PI / 3,
      speed: 2,
      colors: ['#ffffff', '#cccccc'],
      life: 15,
      size: 2,
    });
  }
  
  hit(x: number, y: number): void {
    this.emit(x, y, 10, {
      angle: 0,
      spread: Math.PI * 2,
      speed: 4,
      colors: ['#ff3366', '#ff0000', '#ffffff'],
      life: 20,
      size: 3,
    });
  }
  
  death(x: number, y: number, color: string): void {
    this.emit(x + 8, y + 8, 30, {
      angle: 0,
      spread: Math.PI * 2,
      speed: 6,
      colors: [color, '#ffffff', '#ff0000'],
      life: 40,
      size: 4,
    });
  }
  
  collect(x: number, y: number): void {
    this.emit(x, y, 15, {
      angle: -Math.PI / 2,
      spread: Math.PI / 2,
      speed: 3,
      colors: ['#ffcc00', '#ffff00', '#ffffff'],
      life: 30,
      size: 3,
    });
  }
}

export class ScreenShake {
  intensity: number = 0;
  duration: number = 0;
  offsetX: number = 0;
  offsetY: number = 0;
  
  shake(intensity: number, duration: number): void {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
  }
  
  update(): void {
    if (this.duration > 0) {
      this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
      this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
      this.duration--;
      this.intensity *= 0.95;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
    }
  }
}
