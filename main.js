const { app, BrowserWindow, ipcMain } = require("electron");
const serve = require("electron-serve").default;
const path = require("path");
const sharp = require("sharp");
const JSZip = require("jszip");

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "out")
}) : null;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

function validateFile(type, size) {
  return ALLOWED_TYPES.includes(type) && size <= MAX_FILE_SIZE;
}

// 単一画像圧縮ハンドラー
ipcMain.handle("compress-image", async (event, data) => {
  try {
    const { buffer, type, size, quality, width, height, format, maintainAspectRatio } = data;

    if (!validateFile(type, size)) {
      return { error: '無効なファイル形式またはサイズが大きすぎます' };
    }

    const inputBuffer = Buffer.from(buffer);
    let sharpInstance = sharp(inputBuffer);

    // リサイズ処理
    if (width || height) {
      const resizeOptions = {
        fit: maintainAspectRatio ? 'inside' : 'fill',
        withoutEnlargement: true
      };
      sharpInstance = sharpInstance.resize(width || null, height || null, resizeOptions);
    }

    // 形式変換と品質設定
    let compressedBuffer;
    const outputFormat = format || 'jpeg';

    switch (outputFormat) {
      case 'jpeg':
        compressedBuffer = await sharpInstance.jpeg({ quality: quality || 80 }).toBuffer();
        break;
      case 'png':
        compressedBuffer = await sharpInstance.png({
          quality: quality || 80,
          compressionLevel: Math.floor((100 - (quality || 80)) / 10)
        }).toBuffer();
        break;
      case 'webp':
        compressedBuffer = await sharpInstance.webp({ quality: quality || 80 }).toBuffer();
        break;
      default:
        compressedBuffer = await sharpInstance.jpeg({ quality: quality || 80 }).toBuffer();
    }

    // メタデータ取得
    const metadata = await sharp(inputBuffer).metadata();
    const compressedMetadata = await sharp(compressedBuffer).metadata();

    const compressionRatio = ((size - compressedBuffer.length) / size * 100).toFixed(1);

    return {
      success: true,
      originalSize: size,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      },
      compressedDimensions: {
        width: compressedMetadata.width,
        height: compressedMetadata.height
      },
      compressedImage: `data:image/${outputFormat};base64,${compressedBuffer.toString('base64')}`
    };

  } catch (error) {
    console.error('圧縮エラー:', error);
    return { error: '画像圧縮に失敗しました' };
  }
});

// バッチ圧縮ハンドラー
ipcMain.handle("compress-batch", async (event, data) => {
  try {
    const { files, quality, width, height, format, maintainAspectRatio } = data;

    if (!files || files.length === 0) {
      return { error: 'ファイルが見つかりません' };
    }

    // すべてのファイルをバリデーション
    for (const file of files) {
      if (!validateFile(file.type, file.size)) {
        return { error: `無効なファイル形式またはサイズが大きすぎます: ${file.name}` };
      }
    }

    const zip = new JSZip();
    const results = [];
    const outputFormat = format || 'jpeg';

    // 各ファイルを処理してZIPに追加
    for (const file of files) {
      try {
        const inputBuffer = Buffer.from(file.buffer);
        let sharpInstance = sharp(inputBuffer);

        // リサイズ処理
        if (width || height) {
          const resizeOptions = {
            fit: maintainAspectRatio ? 'inside' : 'fill',
            withoutEnlargement: true
          };
          sharpInstance = sharpInstance.resize(width || null, height || null, resizeOptions);
        }

        // 形式変換と品質設定
        let compressedBuffer;

        switch (outputFormat) {
          case 'jpeg':
            compressedBuffer = await sharpInstance.jpeg({ quality: quality || 80 }).toBuffer();
            break;
          case 'png':
            compressedBuffer = await sharpInstance.png({
              quality: quality || 80,
              compressionLevel: Math.floor((100 - (quality || 80)) / 10)
            }).toBuffer();
            break;
          case 'webp':
            compressedBuffer = await sharpInstance.webp({ quality: quality || 80 }).toBuffer();
            break;
          default:
            compressedBuffer = await sharpInstance.jpeg({ quality: quality || 80 }).toBuffer();
        }

        // ファイル名の拡張子を変更
        const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        const originalName = file.name.split('.')[0];
        const compressedFileName = `compressed_${originalName}.${extension}`;

        // ZIPにファイルを追加
        zip.file(compressedFileName, compressedBuffer);

        // メタデータ取得
        const metadata = await sharp(inputBuffer).metadata();
        const compressedMetadata = await sharp(compressedBuffer).metadata();

        const compressionRatio = ((file.size - compressedBuffer.length) / file.size * 100).toFixed(1);

        results.push({
          originalName: file.name,
          compressedName: compressedFileName,
          originalSize: file.size,
          compressedSize: compressedBuffer.length,
          compressionRatio: `${compressionRatio}%`,
          originalDimensions: {
            width: metadata.width,
            height: metadata.height
          },
          compressedDimensions: {
            width: compressedMetadata.width,
            height: compressedMetadata.height
          }
        });
      } catch (error) {
        console.error(`ファイル処理エラー (${file.name}):`, error);
        return { error: `ファイル処理に失敗しました: ${file.name}` };
      }
    }

    // ZIPファイルを生成
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return {
      success: true,
      results,
      zipFile: `data:application/zip;base64,${zipBuffer.toString('base64')}`,
      zipSize: zipBuffer.length,
      totalOriginalSize: results.reduce((sum, result) => sum + result.originalSize, 0),
      totalCompressedSize: results.reduce((sum, result) => sum + result.compressedSize, 0)
    };

  } catch (error) {
    console.error('バッチ圧縮エラー:', error);
    return { error: '画像のバッチ圧縮に失敗しました' };
  }
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
}

app.on("ready", () => {
    createWindow();
});

app.on("window-all-closed", () => {
    app.quit();
});
