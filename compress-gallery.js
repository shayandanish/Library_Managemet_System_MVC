// compress-gallery.js
//
// This script recursively compresses JPEG and PNG images in the
// `public/images/gallery` folder using the sharp library.  It overwrites
// each file with a compressed version to reduce storage and improve
// load times.  Call this script manually with `node compress-gallery.js`.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Directory containing your uncompressed images.  You can change
// this path if your images live elsewhere.  In this project the
// gallery folder resides under public/images/gallery, so the path
// reflects that structure.  Adjust the segments if your
// directory layout differs.
const inputDir = path.join(__dirname, "public", "images", "gallery");

/**
 * Recursively walk through a directory, compressing JPEG and PNG files.
 * JPEGs are saved with a lower quality setting; PNGs use a high
 * compression level.  Other file types are ignored.  The function
 * awaits each sharp call to avoid exhausting system resources.
 *
 * @param {string} dir The directory to process
 */
async function compressDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Recurse into subdirectories
      await compressDir(filePath);
    } else {
      // Process only JPEG or PNG files (case-insensitive)
      const ext = path.extname(file).toLowerCase();
      try {
        if (ext === ".JPG" || ext === ".jpeg") {
          // Compress JPEG: adjust quality down from 100 (max). Higher quality
          // values produce larger files; lower values save more space but
          // degrade image fidelity. 75 is a reasonable default.
          await sharp(filePath)
            .jpeg({ quality: 75 })
            .toFile(filePath + ".tmp");
          fs.renameSync(filePath + ".tmp", filePath);
          console.log(`Compressed JPEG: ${filePath}`);
        } else if (ext === ".png") {
          // Compress PNG: use quality and compressionLevel. The `quality`
          // option for PNG controls palette quantization, while
          // `compressionLevel` (0-9) sets zlib compression.  Higher values
          // reduce file size at the cost of CPU time.  Quality around 75
          // typically reduces colors but keeps images usable.
          await sharp(filePath)
            .png({ quality: 75, compressionLevel: 9 })
            .toFile(filePath + ".tmp");
          fs.renameSync(filePath + ".tmp", filePath);
          console.log(`Compressed PNG: ${filePath}`);
        }
        // Unsupported file types are silently skipped
      } catch (err) {
        // Log but continue on errors; one failing file shouldn’t stop the process
        console.error(`Error compressing ${filePath}:`, err.message);
      }
    }
  }
}

// Kick off compression and report when done.  Catch any top‑level errors.
compressDir(inputDir)
  .then(() => {
    console.log("Image compression complete");
  })
  .catch((err) => {
    console.error("Compression process failed:", err);
  });
