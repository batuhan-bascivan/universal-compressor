# Universal Compressor

A desktop application for Windows that compresses images, videos, audio files, and documents — all in one place.

Built with **Electron**, **React**, **TypeScript**, and **Vite**.

## Features

- **Image compression** — JPG, PNG, WebP, AVIF
- **Video compression** — MP4, MKV, AVI, MOV, WebM
- **Audio compression** — MP3, WAV, AAC, OGG, M4A
- **Document compression** — PDF, DOCX, PPTX, XLSX
- **3 compression levels** — Low, Balanced, Max
- **Custom output folder** selection
- **Dark / Light theme** toggle
- **Drag & Drop** support

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run electron:dev
```

This starts the Vite dev server and opens the Electron window.

### Build for Windows

```bash
npm run electron:build
```

Generates an installer (NSIS) and a portable `.exe` in the `release/` folder.

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS |
| Desktop    | Electron                          |
| Build      | Vite, electron-builder            |
| Images     | Sharp                             |
| Video/Audio| FFmpeg (via fluent-ffmpeg)         |
| PDF        | pdf-lib                           |
| Office     | JSZip + Sharp                     |

## License

MIT
