<div align="center">

<img src="/src-tauri/icons/icon.ico" width="140" alt="ClipBubble Logo">

# ClipBubble

![Release](https://img.shields.io/badge/release-v2.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-success)
![License](https://img.shields.io/badge/license-MIT-green)
![Future](https://img.shields.io/badge/Linux%20%7C%20macOS-Planned-lightgrey)

A lightweight, high-performance Windows application that displays your recent clipboard history as beautiful floating bubbles.

</div>

![ClipBubble](/assets/image.png)

---

## Features

- 🎈 **Floating Clipboard Bubbles** – Recent clipboard items appear as lightweight floating bubbles.
- ✨ **Organic Motion** – Smooth drifting animation with natural movement.
- ⚡ **Hardware Accelerated** – Optimized animations with minimal CPU and memory usage.
- 📋 **One-Click Paste** – Click any bubble to copy its content and automatically paste it into the active application.
- 🖱 **Interactive Hover** – Bubbles stop moving and become fully visible when hovered.
- 🔔 **System Tray Integration** – Runs quietly in the background with quick access from the tray.
- ⌨ **Global Hotkeys** – Configure keyboard shortcuts for common actions.

---

# Download & Usage

## Windows (Portable)

No installation is required.

1. Download **`ClipBubble.exe`** from the latest release.
2. Double-click **`ClipBubble.exe`**.
3. The application starts in the background and places an icon in the Windows system tray.
4. Copy text normally (`Ctrl + C`) and ClipBubble will automatically display your recent clipboard items as floating bubbles.

> **ClipBubble is fully portable.** It does not require installation and can be run from any folder or USB drive.

---

## Configuration

Most settings can be accessed from the **system tray icon**, including:

- Bubble lifetime
- Maximum bubble count
- Global hotkeys
- Exit ClipBubble

---

# Development

The following instructions are only for developers who want to build or contribute to ClipBubble.

## Prerequisites

Install the following:

- Rust (latest stable)
- Node.js and npm
- Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

---

## Clone Repository

```bash
git clone https://github.com/yourusername/clipbubble.git
cd clipbubble
```

Replace the repository URL with the actual GitHub repository.

---

## Install Dependencies

```bash
cd ui
npm install
cd ..
```

---

## Run Development Version

```bash
cd src-tauri
tauri dev
```

This starts the frontend development server and builds the Rust backend.

---

## Build Release

To build the executable yourself:

```bash
cd src-tauri
tauri build
```

The generated executable and bundles will be available under:

```
src-tauri/target/release/bundle/
```

---

# Technology Stack

- **Backend:** Rust + Tauri v2
- **Frontend:** HTML, CSS, JavaScript
- **Clipboard:** arboard
- **Input Simulation:** enigo
- **Windows APIs:** windows crate

---

# Roadmap

- ✅ Windows portable release
- 🔄 Customizable themes
- 🔄 Search clipboard history
- 🔄 Image clipboard support
- 🔄 Favorites / Pin clipboard items
- 🔄 Linux support
- 🔄 macOS support

---

# License

This project is released under the MIT License.