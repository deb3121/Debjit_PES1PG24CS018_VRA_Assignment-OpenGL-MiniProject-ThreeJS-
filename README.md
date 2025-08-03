# 🌌 Solar System & 🌲 Mindfulness Forest Simulation Projects

This repository contains **two interactive graphics projects**:

1. **Solar System Simulation** using **OpenGL & GLUT**
2. **Mindfulness Forest** using **Three.js**

## 📁 Project 1: Realistic Solar System Simulation

### 🚀 Description:

An animated 3D simulation of the solar system built using OpenGL and GLUT. It includes textured planets, accurate orbits, a meteor shower, and interactive camera views.

### 🔧 Features:

* Realistic orbit-based planetary motion
* Rotating textured planets with lighting
* Shooting star/meteor shower effect
* Zoom control and perspective switching
* Labels for each celestial body
* Custom textures for 8 planets and the sun

### 🎮 Controls:

| Key           | Function                |
| ------------- | ----------------------- |
| `B`           | Toggle planet animation |
| `M`           | Toggle meteor shower    |
| `1`           | Slow down animation     |
| `2`           | Speed up animation      |
| `+/-`         | Zoom in/out             |
| `Left Click`  | Switch camera view      |
| `Right Click` | Toggle animation        |
| `Esc`         | Exit                    |

### 🖼️ Assets Required:

Place these texture images in your working directory:

* `8k_sun.jpg`
* `8k_mercury.jpg`
* `8k_venus_surface.jpg`
* `8k_earth_daymap.jpg`
* `8k_mars.jpg`
* `8k_jupiter.jpg`
* `8k_saturn.jpg`
* `2k_uranus.jpg`
* `2k_neptune.jpg`

> All textures should be downloaded in `.jpg` format and named exactly as above.


## 📁 Project 2: Mindfulness Forest (Three.js)

### 🌿 Description:

A calming and immersive 3D forest experience built using **Three.js**, designed to promote mindfulness and tranquility. Includes real-time rain, day/night transitions, interactive quotes, and spatial audio.

### 🎮 Features:

* Fully 3D interactive forest
* Procedural sky with day/night cycle
* Dynamic rain system with sound
* Ambient forest sounds and positional waterfall audio
* Randomly displayed mindfulness quotes
* Keyboard navigation with first-person controls

### 🔧 Technologies Used:

* `three.js` for 3D rendering
* `GLTFLoader` for importing models
* `PointerLockControls` for immersive movement
* HTML/CSS for overlay UI
* MP3 audio support via Web Audio API

### 📦 File Structure:

```
📁 public/
    📁 models/
        forest.glb
    📁 sounds/
        nature_sound.mp3
        rain_sound.mp3
        water_sound.mp3
📁 src/
    index.js
    other JS modules...
index.html
style.css
```

### ⌨️ Controls:

| Key                   | Action                             |
| --------------------- | ---------------------------------- |
| `Click`               | Lock pointer and start environment |
| `WASD` / `Arrow Keys` | Move around                        |
| `Q`                   | Show a mindfulness quote           |
| `R`                   | Toggle rain and rain sound         |
| `N`                   | Toggle day/night                   |
| `Esc`                 | Unlock pointer and pause sounds    |

---

## ✅ How to Run

### For the OpenGL Project (Solar System):
1. Make sure you have GLUT and OpenGL installed.
2. Compile using a command:
   ```
   gcc solar_system.c -lGL -lGLU -lglut -o solar
   ./solar
   ```

### For the Three.js Project (Mindfulness Forest):
1. Set up a local server (e.g., with `Live Server` in VS Code or run `npx serve`).
2. Place all files in the correct directories (`models`, `sounds`, etc.).
3. Open the browser and explore.
---

