<div align="center">

<img src="/src-tauri/icons/icon.ico" width="140" alt="ClipBubble Logo">

# ClipBubble

**A beautiful, lightweight clipboard history manager that lives on your desktop as floating bubbles.**

![Release](https://img.shields.io/badge/release-v1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-success)
![License](https://img.shields.io/badge/license-AGPL3.0-green)
![Future](https://img.shields.io/badge/Linux%20%7C%20macOS-Planned-lightgrey)
Transform your clipboard history into an elegant desktop experience. ClipBubble runs quietly in the background and displays your recently copied items as interactive floating bubbles, making it easy to reuse clipboard content without interrupting your workflow.

**🚀 Portable • ⚡ Fast • 🪶 Lightweight • 🦀 Native Rust • 💻 Windows**

</div>

![ClipBubble](/assets/image.png)

---

# 💬 Why ClipBubble?

Most clipboard managers hide your clipboard history behind windows, menus, or keyboard shortcuts.

ClipBubble takes a different approach by displaying your recent clipboard items as elegant floating bubbles directly on your desktop. Simply click a bubble to instantly copy and paste its content into your active application.

Built with **Rust** and **Tauri v2**, ClipBubble delivers smooth animations and native performance while keeping CPU and memory usage extremely low.

Whether you're a developer, writer, student, or office professional, ClipBubble helps you work faster by keeping your clipboard history always within reach.

---

# ✨ Features

- 🎈 **Floating Clipboard Bubbles** – Recent clipboard items appear as beautiful floating bubbles.
- ✨ **Organic Motion** – Smooth drifting animation with natural movement.
- ⚡ **Hardware Accelerated** – Native performance with minimal CPU and memory usage.
- 📋 **One-Click Copy & Auto Paste** – Click any bubble to copy its content and automatically paste it into the active application.
- 🖱 **Interactive Hover Effects** – Bubbles pause and become fully visible when hovered.
- 🔔 **System Tray Integration** – Runs quietly in the Windows system tray.
- ⌨ **Global Hotkeys** – Quickly perform common actions using keyboard shortcuts.
- 🚀 **Portable** – No installation required. Simply run `ClipBubble.exe`.

---

# 🚀 Download & Usage

## Windows

ClipBubble is a **portable application**.

1. Download **`ClipBubble.exe`** from the latest GitHub Release.
2. Run **`ClipBubble.exe`**.
3. The application starts in the background and appears in the Windows system tray.
4. Copy text normally (`Ctrl + C`) and your recent clipboard items will appear as floating bubbles.

> **No installation required.** You can run ClipBubble from any folder or even a USB drive.

---

# ⚙️ Configuration

Most settings are available from the **system tray icon**, including:

- Bubble lifetime
- Maximum number of bubbles
- Global hotkeys
- Exit ClipBubble

---

# 🛠️ Development

The following instructions are only for developers who want to build ClipBubble from source or contribute to the project.

## Prerequisites

Install:

- Rust (latest stable)
- Node.js & npm
- Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

---

## Clone the Repository

```bash
git clone https://github.com/yourusername/clipbubble.git
cd clipbubble
```

> Replace the repository URL with your actual GitHub repository.

---

## Install Dependencies

```bash
cd ui
npm install
cd ..
```

---

## Run in Development Mode

```bash
cd src-tauri
tauri dev
```

This starts the frontend development server and builds the Rust backend.

---

## Build a Release

```bash
cd src-tauri
tauri build
```

The generated binaries and bundles will be available in:

```
src-tauri/target/release/bundle/
```

---

# Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Rust |
| Desktop Framework | Tauri v2 |
| Frontend | HTML, CSS, JavaScript |
| Clipboard Access | arboard |
| Input Simulation | enigo |
| Windows APIs | windows crate |

---

# 🗺️ Roadmap

- ✅ Windows portable release
- 🔄 Search clipboard history
- 🔄 Image clipboard support
- 🔄 Favorite / Pin clipboard items
- 🔄 Custom themes
- 🔄 Linux support
- 🔄 macOS support

---

# 🤝 Contributing

Contributions, bug reports, feature requests, and pull requests are welcome.

If you find a bug or have an idea for a new feature, feel free to open an issue.

---

# 📄 License

This project is licensed under the **GNU AGPL-3.0** License.

See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**If ClipBubble improves your workflow, consider giving the project a ⭐ on GitHub.**

Made with ❤️ using **Rust** and **Tauri**

</div>
