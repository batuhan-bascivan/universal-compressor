<p align="center">
  <img src="src/assets/logo.svg" alt="Universal Compressor Logo" width="64" height="64" />
</p>

# Universal Compressor

[Download Latest Release](https://github.com/batuhan-bascivan/universal-compressor/releases/latest)

A desktop application for local file compression across images, video, audio, and documents entirely on your machine.


## Description

Universal Compressor provides a streamlined interface for compressing files directly on your local machine. By leveraging Electron, FFmpeg, Sharp, and Archiver, the application ensures that no data ever leaves your computer during the process, prioritizing privacy and performance.

### Key Features

*   **Offline Processing:** All compressions are performed locally—no upload, no cloud.
*   **Broad Format Support:** Efficiently compress images, audio, video, and documents.
*   **Custom Output Folder:** Select any destination directory for your compressed files.
*   **Drag & Drop:** Simply drop files onto the interface to get started.
*   **Batch Compression:** Compress multiple files at once with a single click.
*   **Dark / Light Theme:** Toggle between themes to match your preference.
*   **Cross-Platform Ready:** Built using Electron for desktop compatibility.
*   **Modern Interface:** Built with React and Tailwind CSS for a responsive user experience.

## Prerequisites

Ensure you have the following installed:

*   **Node.js** (version 18 or higher)
*   **npm** (usually bundled with Node.js)

## Getting Started

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/batuhan-bascivan/universal-compressor.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd universal-compressor
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Development

To start the application in development mode:

```bash
npm run electron:dev
```

This starts the Vite dev server and launches the Electron window automatically.

### Production Build

To build the application for Windows:

```bash
npm run electron:build
```

Generates a portable `.exe` in the `release/` folder.


## Technical Stack

*   **Electron** — Framework for cross-platform desktop applications.
*   **React** — UI library for building the user interface.
*   **TypeScript** — Strongly typed programming language.
*   **Vite** — Fast build tool and dev server.
*   **Tailwind CSS** — Utility-first CSS framework.
*   **Shadcn/ui** — Component library for UI elements.
*   **FFmpeg** — Multimedia framework for video and audio compression.
*   **Sharp** — High-performance Node.js image processing library.
*   **Archiver / JSZip** — Libraries for archive compression.
*   **PDF-lib** — PDF manipulation and optimization.
