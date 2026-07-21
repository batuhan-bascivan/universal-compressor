import { app, BrowserWindow, ipcMain, shell, Menu, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import sharp from 'sharp';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

const isDev = !app.isPackaged;
const appIcon = path.join(__dirname, '../build/icon.ico');

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'));
}
if (ffprobePath?.path) {
    ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'));
}

function createWindow() {
    const preloadPath = path.join(app.getAppPath(), 'dist-electron', 'preload.js');
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        icon: appIcon,
        autoHideMenuBar: true,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: false,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const calculateBitrate = async (
    filePath: string,
    percentage: number,
    isVideo: boolean = true
): Promise<{ vBitrate: number; aBitrate: number }> => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err || !metadata?.format) {
                console.warn('ffprobe failed or missing format data', err);
                const stat = fs.statSync(filePath);
                const duration = 10;
                const originalTotalBitrate = (stat.size * 8) / duration;
                if (isVideo) {
                    resolve({
                        vBitrate: originalTotalBitrate * (percentage / 100) * 0.8,
                        aBitrate: 64000,
                    });
                } else {
                    resolve({
                        vBitrate: 0,
                        aBitrate: originalTotalBitrate * (percentage / 100),
                    });
                }
                return;
            }
            const duration = metadata.format.duration || 1;
            const size = metadata.format.size || fs.statSync(filePath).size;
            const originalBitrate = (size * 8) / duration;
            const targetTotalBitrate = originalBitrate * (percentage / 100);
            if (isVideo) {
                const vBitrate = targetTotalBitrate * 0.8;
                const aBitrate = targetTotalBitrate * 0.2;
                resolve({
                    vBitrate: Math.max(10000, vBitrate),
                    aBitrate: Math.max(16000, Math.min(aBitrate, 128000)),
                });
            } else {
                resolve({
                    vBitrate: 0,
                    aBitrate: Math.max(16000, targetTotalBitrate),
                });
            }
        });
    });
};

ipcMain.handle('compress-file', async (_event, filePath, percentageStr, outputDir) => {
    try {
        const percentage = parseFloat(percentageStr);
        if (isNaN(percentage) || percentage <= 0) throw new Error('Invalid percentage');
        const ext = path.extname(filePath).toLowerCase().substring(1);
        const baseName = path.basename(filePath, `.${ext}`);
        const finalOutputDir = outputDir || app.getPath('downloads');
        let outputPath = path.join(finalOutputDir, `${baseName}_compressed_${percentage}pct.${ext}`);
        const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
        const videoFormats = ['mp4', 'mkv', 'avi', 'mov', 'webm'];
        const audioFormats = ['mp3', 'wav', 'aac', 'ogg', 'm4a'];
        const officeFormats = ['docx', 'pptx', 'xlsx'];

        if (imageFormats.includes(ext)) {
            const q = Math.max(1, Math.min(100, Math.floor(percentage)));
            const scaleFactor = Math.sqrt(percentage / 100);
            let s = sharp(filePath);
            const metadata = await s.metadata();
            if (metadata.width && scaleFactor < 1) {
                const targetWidth = Math.max(16, Math.floor(metadata.width * scaleFactor));
                s = s.resize({ width: targetWidth, withoutEnlargement: true });
            }
            if (ext === 'png') {
                await s.png({ quality: q, compressionLevel: 9 }).toFile(outputPath);
            } else if (ext === 'webp') {
                await s.webp({ quality: q }).toFile(outputPath);
            } else if (ext === 'avif') {
                await s.avif({ quality: q }).toFile(outputPath);
            } else {
                await s.jpeg({ quality: q, mozjpeg: true }).toFile(outputPath);
            }
        } else if (videoFormats.includes(ext)) {
            const { vBitrate, aBitrate } = await calculateBitrate(filePath, percentage, true);
            const videoKbps = Math.max(10, Math.floor(vBitrate / 1000));
            const audioKbps = Math.max(8, Math.floor(aBitrate / 1000));
            await new Promise((resolve, reject) => {
                let command = ffmpeg(filePath);
                if (ext === 'webm') {
                    command = command
                        .videoCodec('libvpx-vp9')
                        .audioCodec('libopus')
                        .videoBitrate(`${videoKbps}k`)
                        .audioBitrate(`${audioKbps}k`)
                        .outputOptions(['-deadline', 'realtime', '-cpu-used', '8']);
                } else {
                    // mp4, mkv, mov, avi
                    command = command
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .videoBitrate(`${videoKbps}k`)
                        .audioBitrate(`${audioKbps}k`)
                        .outputOptions(['-preset', 'fast']);
                }
                command
                    .on('end', () => resolve(outputPath))
                    .on('error', (err: Error) => reject(err))
                    .save(outputPath);
            });
        } else if (audioFormats.includes(ext)) {
            const { aBitrate } = await calculateBitrate(filePath, percentage, false);
            const minAudioKbps = ext === 'ogg' ? 32 : 8;
            const audioKbps = Math.max(minAudioKbps, Math.floor(aBitrate / 1000));
            await new Promise((resolve, reject) => {
                let command = ffmpeg(filePath);
                if (ext === 'wav') {
                    // WAV is uncompressed: reduce sample rate based on percentage
                    const sampleRates = [8000, 16000, 22050, 44100, 48000];
                    const idx = Math.min(sampleRates.length - 1, Math.floor((percentage / 100) * (sampleRates.length - 1)));
                    const targetSampleRate = sampleRates[idx];
                    command = command
                        .audioCodec('pcm_s16le')
                        .audioFrequency(targetSampleRate)
                        .audioChannels(percentage <= 30 ? 1 : 2);
                } else if (ext === 'ogg') {
                    command = command
                        .audioCodec('libvorbis')
                        .audioBitrate(`${audioKbps}k`);
                } else if (ext === 'aac' || ext === 'm4a') {
                    command = command
                        .audioCodec('aac')
                        .audioBitrate(`${audioKbps}k`);
                } else {
                    // mp3 and others
                    command = command
                        .audioBitrate(`${audioKbps}k`);
                }
                command
                    .on('end', () => resolve(outputPath))
                    .on('error', (err: Error) => reject(err))
                    .save(outputPath);
            });
        } else if (ext === 'pdf') {
            const pdfData = fs.readFileSync(filePath);
            const doc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
            // Re-save with object streams for smaller size
            const savedPdf = await doc.save({ useObjectStreams: true });
            fs.writeFileSync(outputPath, savedPdf);
        } else if (officeFormats.includes(ext)) {
            const zip = new JSZip();
            const docArchive = await zip.loadAsync(fs.readFileSync(filePath));
            const scaleFactor = Math.sqrt(percentage / 100);
            const q = Math.max(1, Math.min(100, Math.floor(percentage)));
            for (const [relativePath, file] of Object.entries(docArchive.files)) {
                if (!file.dir && relativePath.includes('media/')) {
                    const mediaExt = path.extname(relativePath).toLowerCase();
                    if (['.jpeg', '.jpg', '.png'].includes(mediaExt)) {
                        try {
                            const imgData = await file.async('nodebuffer');
                            let s = sharp(imgData);
                            const metadata = await s.metadata();
                            if (metadata.width && scaleFactor < 1) {
                                const targetWidth = Math.max(16, Math.floor(metadata.width * scaleFactor));
                                s = s.resize({ width: targetWidth, withoutEnlargement: true });
                            }
                            docArchive.file(relativePath, await s.jpeg({ quality: q, mozjpeg: true }).toBuffer());
                        } catch {
                            console.warn('Could not compress media file', relativePath);
                        }
                    }
                }
            }
            fs.writeFileSync(
                outputPath,
                await docArchive.generateAsync({
                    type: 'nodebuffer',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 9 },
                })
            );
        } else {
            outputPath = path.join(finalOutputDir, `${baseName}_compressed.zip`);
            const archiver = require('archiver');
            await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(outputPath);
                const archive = archiver('zip', { zlib: { level: 9 } });
                output.on('close', () => resolve(outputPath));
                archive.on('error', (err: Error) => reject(err));
                archive.pipe(output);
                archive.file(filePath, { name: path.basename(filePath) });
                archive.finalize();
            });
        }
        shell.showItemInFolder(outputPath);
        return { success: true, path: outputPath };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Compression error:', error);
        return { success: false, error: message };
    }
});

ipcMain.handle('show-in-folder', (_event, filePath) => {
    shell.showItemInFolder(filePath);
});

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    }) as unknown as { canceled: boolean; filePaths: string[] };
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});
