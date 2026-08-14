# Universal Converter

A desktop application for local file conversion across images, video, audio, and documents entirely on your machine.

## Description

Universal Converter provides a streamlined interface for converting files directly on your local machine. By leveraging Electron, FFmpeg, Sharp, and Mammoth, the application ensures that no data ever leaves your computer during the process, prioritizing privacy and performance.

### Key Features

*   **Offline Processing:** All conversions are performed locally no upload, no cloud.
*   **Broad Format Support:** Handles common and professional formats for images, audio, video, and documents.
*   **Custom Output Folder:** Select any destination directory for your converted files.
*   **Drag & Drop:** Simply drop files onto the interface to get started.
*   **Batch Conversion:** Convert multiple files at once with a single click.
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
    git clone https://github.com/batuhan-bascivan/universal-converter.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd universal-converter
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

Generates an NSIS installer and a portable `.exe` in the `release/` folder.

## Supported Formats

### Images
JPG, PNG, WEBP, GIF, BMP, TIFF, ICO, PDF

### Video
MP4, MOV, AVI, MKV, WEBM, FLV, WMV

### Audio
MP3, WAV, AAC, OGG, FLAC, M4A, WMA

### Documents
PDF, DOCX, TXT, HTML, ODT

## Technical Stack

*   **Electron** — Framework for cross-platform desktop applications.
*   **React** — UI library for building the user interface.
*   **TypeScript** — Strongly typed programming language.
*   **Vite** — Fast build tool and dev server.
*   **Tailwind CSS** — Utility-first CSS framework.
*   **Shadcn/ui** — Component library for UI elements.
*   **FFmpeg** — Multimedia framework for video and audio conversion.
*   **Sharp** — High-performance Node.js image processing library.
*   **Mammoth** — DOCX to HTML/text extraction library.
*   **pdf-parse** — PDF text extraction library.
*   **docx** — Library for generating Word documents.
