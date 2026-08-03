# Project Specification: ClipBubble (Windows Floating Clipboard Manager)

## 1. Core Concept & System Architecture

A lightweight, high-performance Windows desktop application that visualizes the system clipboard history as floating, organic, and reactive "bubbles." The app must run quietly in the background with zero impact on system productivity.

### Architecture Requirements

- **Backend:** Rust (using `tauri` v2 or `slint`) to ensure near-zero CPU overhead and ultra-low RAM usage (< 30MB idle).

- **Frontend:** HTML5 / CSS3 / JavaScript (if using Tauri) or native Canvas layout. Must rely strictly on hardware-accelerated animations (GPU) instead of heavy JS loops.

- **Window Flags:** Windows must utilize `WS_EX_TRANSPARENT` and `WS_EX_NOACTIVATE` Win32 styles. The app must *never* steal focus from the user's active application or text cursor.

---

## 2. Visual Style & UI Specifications

The interface must adhere to modern Windows 11 design principles (Fluent / Mica aesthetics).

- **Bubble Geometry:** Perfect circles or smooth pill-shaped cards featuring a blur backdrop-filter (`backdrop-filter: blur(12px)`).

- **Opacity:** Semi-transparent base state (60% opacity) that scales smoothly to full opacity (100%) on mouse hover.

- **Content Display:**

  - Center of the bubble shows an icon indicating data type (Text, Link, Code snippet).

  - Text is truncated sharply (e.g., first 12 characters followed by "...").

  - On mouse hover, a stylized, instant micro-tooltip scales upward showing the complete un-truncated string.

---

## 3. Dynamic Animation Engine (Crucial)

### A. Lifecycle Animations

- **Spawn (Creation):** A rapid, elastic "pop-in" bounce effect. Scale transitions instantly from `0.2` to `1.1`, then settles back to `1.0` within `300ms` using a cubic-bezier curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

- **Death (Destruction):** A smooth dissipation effect. The bubble expands slightly to scale `1.2` while its opacity fades to `0` simultaneously over `250ms`, followed immediately by window/DOM node destruction to free system memory.

### B. Floating & Drift Mechanics

- **Organic Drift:** Bubbles must glide across the screen along a non-linear path. Use a continuous, low-frequency sine/cosine wave algorithm to simulate drifting water bubbles.

- **Screen Caps:** Maximum concurrent bubble limit is strictly clamped (Default: 3 to 5). Spawning a new bubble past the limit must instantly trigger the "Death" animation on the oldest bubble.

### C. Mouse Pointer Interactivity

- **Magnetic Attraction / Repulsion:** When the mouse pointer gets within a 100px radius of a bubble, the bubble should gently alter its trajectory to either drift slightly toward the cursor (attraction) or push away (repulsion) dynamically.

- **Velocity Dampening:** Once the mouse pointer directly hovers *over* a bubble, all drift and wave animations must immediately decelerate to a complete stop, locking the bubble into a stationary state for easy clicking.

---

## 4. Feature Set & Controls

- **Smart Auto-Paste Injection:** Left-clicking an active bubble copies its cached value to the OS clipboard, hides the bubble via the Death animation, and fires a programmatic `Ctrl + V` synthetic keyboard input to paste data directly into the active form field.

- **System Tray Configuration:** A native system tray menu managing global preferences:

  - Bubble capacity slider (1 to 10 bubbles max).

  - Lifetime duration slider (5s to 30s before auto-destruction).

  - Custom Global Hotkey binds (e.g., `Ctrl + Shift + B` to clear all current active bubbles).