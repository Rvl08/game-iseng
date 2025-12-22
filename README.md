# 🎮 Pixel-Clash Battle Royale

A 2D Pixel Art multiplayer Battle Royale game where players use smartphones as controllers. Features a destructible environment (Terraria-style) with a "Shared Screen" architecture.

![Pixel-Clash Banner](https://via.placeholder.com/800x400/0a0a12/ff3366?text=PIXEL-CLASH+BATTLE+ROYALE)

## ✨ Features

- 🎨 **Pixel Art Graphics** - Retro 16x16 tileset with CRT arcade aesthetics
- 🌍 **Procedural World** - Randomly generated terrain with caves and platforms
- 📱 **Mobile Controller** - Virtual joystick and action buttons with haptic feedback
- 🔊 **Synthesized Audio** - All sound effects generated using Web Audio API (no external files needed!)
- 🎵 **Dynamic Music** - Procedural background music during battle
- ✨ **Particle Effects** - Explosions, hits, jumps, and death animations
- 📺 **Screen Shake** - Impactful camera shake on hits and explosions
- 🌐 **Bilingual** - English and Indonesian language support
- 🏆 **Kill Feed** - Real-time elimination notifications
- 🗺️ **Shrinking Zone** - Battle royale "fog" mechanic

## 🚀 Deployment ke Vercel

### Langkah 1: Persiapan Repository

1. **Buat GitHub Repository baru:**
   ```bash
   # Di folder project
   git init
   git add .
   git commit -m "Initial commit - Pixel-Clash Battle Royale"
   git branch -M main
   git remote add origin https://github.com/USERNAME/pixel-clash-game.git
   git push -u origin main
   ```

2. **Atau upload langsung:**
   - Buka https://github.com/new
   - Buat repository baru
   - Upload semua file project

### Langkah 2: Deploy ke Vercel

1. **Buka Vercel:**
   - Kunjungi https://vercel.com
   - Login dengan akun GitHub

2. **Import Project:**
   - Klik "Add New..." → "Project"
   - Pilih repository `pixel-clash-game`
   - Klik "Import"

3. **Konfigurasi Build:**
   ```
   Framework Preset: Next.js
   Build Command: npm run build (default)
   Output Directory: out (untuk static export)
   Install Command: npm install (default)
   ```

4. **Environment Variables (Opsional untuk Playroom Kit):**
   ```
   NEXT_PUBLIC_PLAYROOM_GAME_ID=your-game-id
   ```

5. **Klik "Deploy"** dan tunggu beberapa menit.

### Langkah 3: Konfigurasi Domain (Opsional)

1. Setelah deploy, Vercel akan memberi URL seperti: `pixel-clash-game.vercel.app`
2. Untuk custom domain:
   - Buka Project Settings → Domains
   - Tambahkan domain custom Anda
   - Update DNS records sesuai instruksi

## 🔧 Setup Lokal untuk Development

### Prerequisites

- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Clone repository
git clone https://github.com/USERNAME/pixel-clash-game.git
cd pixel-clash-game

# Install dependencies
npm install

# Run development server
npm run dev
```

Buka http://localhost:3000 di browser.

## 🎮 Cara Main

### Sebagai Host (PC/TV)

1. Buka game di browser PC/TV
2. Klik "HOST GAME"
3. Tunggu pemain scan QR code
4. Klik "START BATTLE" setelah minimal 2 pemain

### Sebagai Player (Mobile)

1. Scan QR code dari layar Host, ATAU
2. Buka URL game dan klik "JOIN"
3. Masukkan nama (max 8 karakter)
4. Gunakan joystick untuk bergerak
5. Tombol A = Lompat, Tombol B = Serang

### Kontrol

| Aksi | Mobile | Keyboard (Host Dev) |
|------|--------|---------------------|
| Gerak | Joystick Kiri | Arrow Keys |
| Lompat | Tombol A | Space |
| Serang | Tombol B | X |
| Inventory | Tap Slot | 1-5 |

## 🔊 Sistem Audio

Game ini menggunakan **Web Audio API** untuk menghasilkan semua suara secara procedural:

- **Jump** - Sweep naik 200Hz → 400Hz
- **Attack** - Sawtooth sweep turun + noise burst
- **Hit** - Square wave impact
- **Death** - Descending cascade
- **Collect** - C-E-G arpeggio
- **Victory** - Fanfare melody
- **Background Music** - Procedural bass + arpeggio

Tidak ada file audio eksternal yang diperlukan! 🎉

## 🌐 Multiplayer dengan Playroom Kit

Untuk mengaktifkan multiplayer sejati antar device:

### 1. Daftar di Playroom

1. Kunjungi https://joinplayroom.com
2. Buat akun developer
3. Buat game baru dan dapatkan Game ID

### 2. Konfigurasi

Tambahkan di `.env.local`:
```
NEXT_PUBLIC_PLAYROOM_GAME_ID=your-game-id
```

### 3. Update Code

Game sudah menyertakan dependency `playroomkit`. Untuk mengaktifkan:

```typescript
// Di lib/multiplayer.ts
import { insertCoin, onPlayerJoin, usePlayerState } from 'playroomkit';

// Initialize
await insertCoin({
  gameId: process.env.NEXT_PUBLIC_PLAYROOM_GAME_ID,
  maxPlayersPerRoom: 16,
});
```

## 📁 Struktur Project

```
pixel-clash-game/
├── app/
│   ├── globals.css      # Global styles + Tailwind
│   ├── layout.tsx       # Root layout with metadata
│   └── page.tsx         # Main game component
├── lib/
│   ├── audio.ts         # Web Audio synthesizer
│   ├── constants.ts     # Game constants & types
│   └── particles.ts     # Particle system
├── public/
│   └── favicon.ico
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## ⚙️ Konfigurasi Tambahan

### Performance Optimization

Di `next.config.js`, tambahkan jika diperlukan:

```javascript
const nextConfig = {
  // ... existing config
  
  // Optimize images
  images: {
    unoptimized: true, // For static export
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
    ];
  },
};
```

### PWA Support (Progressive Web App)

Untuk membuat game bisa di-install:

1. Install package:
   ```bash
   npm install next-pwa
   ```

2. Update `next.config.js`:
   ```javascript
   const withPWA = require('next-pwa')({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development',
   });
   
   module.exports = withPWA(nextConfig);
   ```

3. Buat `public/manifest.json`:
   ```json
   {
     "name": "Pixel-Clash Battle Royale",
     "short_name": "Pixel-Clash",
     "start_url": "/",
     "display": "fullscreen",
     "orientation": "landscape",
     "background_color": "#0a0a12",
     "theme_color": "#ff3366",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

## 🐛 Troubleshooting

### Audio Tidak Berfungsi

- Browser memerlukan interaksi user sebelum audio bisa play
- Klik dimana saja di halaman untuk mengaktifkan audio
- Periksa volume di Settings

### QR Code Tidak Muncul

- Pastikan package `qrcode.react` terinstall
- Jalankan `npm install` ulang

### Build Error di Vercel

- Pastikan semua dependencies ada di `package.json`
- Check Node.js version (perlu 18+)
- Review build logs di Vercel dashboard

### Mobile Controller Lag

- Gunakan WiFi yang sama untuk Host dan Player
- Untuk production, gunakan Playroom Kit untuk sync yang lebih baik

## 📝 Customization

### Menambah Senjata Baru

Di `lib/constants.ts`:
```typescript
export const WEAPONS = {
  // ... existing weapons
  LASER: { 
    name: 'Laser Gun', 
    damage: 30, 
    range: 400, 
    type: 'ranged', 
    icon: '🔫' 
  },
};
```

### Menambah Sound Effect Baru

Di `lib/audio.ts`, tambahkan case baru:
```typescript
case 'laser': {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
  // ... rest of configuration
  break;
}
```

### Mengganti Warna Tema

Di `lib/constants.ts` dan `tailwind.config.js`, update `COLORS` object.

## 📄 License

MIT License - Bebas digunakan untuk project pribadi maupun komersial.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push dan buat Pull Request

---

Made with 💜 and lots of pixels! 🎮
