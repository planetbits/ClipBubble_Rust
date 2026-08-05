<div align="center">

<img src="/src-tauri/icons/icon.ico" width="140" alt="ClipBubble Logo">


<h1>ClipBubble </h1>

![Release](https://img.shields.io/badge/release-v2.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-success)
![Future](https://img.shields.io/badge/Linux%20%7C%20macOS-Planned-lightgrey)
![Status](https://img.shields.io/badge/status-Stable-success)

</div>


A lightweight, high-performance Windows desktop application that visualizes the system clipboard history as floating, organic, and reactive "bubbles." The app runs quietly in the background with zero impact on system productivity.

![ClipBubble](/assets/image.png)

## Features

- **Floating Bubbles:** Clipboard items appear as visually appealing, semi-transparent bubbles.
- **Organic Drift:** Bubbles glide across the screen along dynamic, non-linear paths.
- **Hardware Accelerated Animations:** Smooth animations for spawning, dissipating, and drifting, ensuring minimal CPU/RAM usage.
- **Smart Auto-Paste:** Click a bubble to copy its content to the clipboard and automatically paste it into the active application.
- **Hover Effects:** Bubbles become fully opaque and stationary on mouse hover for easy interaction.
- **System Tray Integration:** Manage global preferences like bubble capacity and lifetime duration.
- **Custom Hotkeys:** Define global hotkeys for clearing all bubbles.

## Technology Stack

- **Backend:** Rust (Tauri v2)
- **Frontend:** HTML5, CSS3, JavaScript
- **Clipboard:** `arboard` crate
- **Input Simulation:** `enigo` crate
- **Window Management:** Win32 API via `windows` crate for transparency and focus-avoidance.

## Installation & Development

### Prerequisites

- **Rust:** Install Rust from [rustup.rs](https://rustup.rs/). Ensure you have the latest stable version.
- **Node.js & npm:** Required for Tauri development. Download from [nodejs.org](https://nodejs.org/).
- **Tauri CLI:** Install the Tauri CLI globally:
  ```bash
  npm install -g @tauri-apps/cli
  ```

### Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/clipbubble.git
    cd clipbubble
    ```
    *(Note: Replace `https://github.com/yourusername/clipbubble.git` with the actual repository URL if available. For local development, you would have already cloned it.)*

2.  **Install frontend dependencies:**
    ```bash
    cd ui
    npm install
    cd ..
    ```

3.  **Start the development server:**
    This command will build the Rust backend and start the frontend development server.
    ```bash
    cd src-tauri
    tauri dev
    ```

    The application will launch, and you can interact with it by copying text to your clipboard. Bubbles should appear and behave as described.

### Building for Release

To create a production build of ClipBubble:

1.  **Build the application:**
    ```bash
    cd src-tauri
    tauri build
    ```

    This will create an installer package in the `src-tauri/target/release/bundle` directory.

## Configuration

Configuration options for ClipBubble (e.g., bubble capacity, lifetime, hotkeys) are managed via the system tray icon. Right-click the tray icon to access the configuration menu.

*(Note: The system tray menu and configuration UI are placeholders and need further implementation based on the specification.)*
