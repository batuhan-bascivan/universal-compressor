# Universal Compressor

<p align="center">
  <img src="build/icon.ico" alt="Universal Compressor Logo" width="128" height="128">
</p>

A desktop application for local file compression across images, video, audio, and documents.

## Description

Universal Compressor provides a streamlined interface for reducing file size directly on your local machine. By leveraging Electron, FFmpeg, and Sharp, the application ensures that no data leaves your computer during compression, prioritizing privacy and performance.

Adjust the **target size percentage** (1–100%) with the slider: a lower value applies stronger compression; a higher value preserves more quality and detail.

### Key Features

*   **Offline Processing:** All compressions are performed locally.
*   **Adjustable Compression:** Fine-tune output size from 1% to 100% per category (images, video, audio, documents).
*   **Broad Format Support:** Handles common formats for images, audio, video, and office documents.
*   **Batch Processing:** Compress multiple files in one tab, with progress tracking per file.
*   **Custom Output Folder:** Choose where compressed files are saved (defaults to Downloads).
*   **Cross-Platform:** Built with Electron for compatibility across multiple operating systems.
*   **Modern Interface:** Built with React and Tailwind CSS for a responsive user experience.

## Prerequisites

Ensure you have the following installed:

*   **Node.js** (version 18 or higher)
*   **npm** (usually bundled with Node.js)

For PDF compression with maximum quality settings, **Ghostscript** may be used by the `pdf-compress` module when available on your system. If it is missing, the app falls back to a built-in PDF optimization path.

## Getting Started

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/zekobinks/universal-compressor.git
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

### Production Build

To build the application for Windows (installer + portable):

```bash
npm run electron:build
```

Build artifacts are written to the `release/` directory.

## Supported Formats

### Images

JPG, JPEG, PNG, WEBP, AVIF

Compression adjusts JPEG/WebP/AVIF quality and PNG compression level. Dimensions are scaled down when the target percentage is below 100%.

### Video

MP4, MKV, AVI, MOV, WEBM

Video bitrate is calculated from the original file and your target percentage. WebM output uses VP9 + Opus; other containers use H.264.

### Audio

MP3, WAV, AAC, OGG, M4A

Audio bitrate is derived from the target percentage. OGG uses a minimum bitrate so very low settings remain valid for the Vorbis encoder.

### Documents

PDF, DOCX, PPTX, XLSX

*   **PDF:** Compression level is mapped from your percentage (stronger below 25%, lighter above 75%).
*   **Office files:** Embedded images in `media/` folders are recompressed; the document structure is preserved.

### Other files

Unsupported extensions are packaged into a **ZIP** archive with maximum deflate compression.

## How Compression Works

| Type        | What changes with the percentage slider                          |
|-------------|-------------------------------------------------------------------|
| Images      | Quality (1–100) and optional resize (√scale of percentage)       |
| Video/Audio | Target bitrate relative to the source file                       |
| PDF         | Ghostscript preset (screen → prepress) via percentage ranges     |
| Office      | Quality and resize of embedded JPEG/PNG images                   |
| Other       | ZIP only (percentage does not change archive logic)              |

Output files are named: `{original}_compressed_{percentage}pct.{ext}` (or `{original}_compressed.zip` for the fallback).

## Technical Stack

*   **Electron** — Cross-platform desktop shell.
*   **React** — User interface.
*   **TypeScript** — Application logic.
*   **Tailwind CSS** — Styling.
*   **Shadcn/ui** — UI components.
*   **FFmpeg** — Video and audio compression (`fluent-ffmpeg`, `ffmpeg-static`, `ffprobe-static`).
*   **Sharp** — Image processing.
*   **pdf-compress** / **pdf-lib** — PDF optimization.
*   **JSZip** — Office document (OOXML) handling.
*   **Archiver** — ZIP fallback for unsupported types.

## Verification

An automated test suite checks every supported format at percentages 1–100:

```bash
node scripts/verify-compression.cjs
```

Results are saved to `verification-report.json`. To re-test specific formats only:

```bash
node scripts/verify-compression.cjs --only=video-webm,audio-ogg
```

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
