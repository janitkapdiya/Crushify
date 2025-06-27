// Node.js Express server for HEIC to JPG/PNG conversion
// Install dependencies: npm install express multer sharp heic-convert cors

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const heicConvert = require('heic-convert');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());

app.post('/api/convert-heic', upload.single('file'), async (req, res) => {
  try {
    const inputBuffer = fs.readFileSync(req.file.path);
    // Try to convert to JPEG
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });
    fs.unlinkSync(req.file.path);
    res.set('Content-Type', 'image/jpeg');
    res.send(outputBuffer);
  } catch (err) {
    // Try PNG fallback
    try {
      const inputBuffer = fs.readFileSync(req.file.path);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: 'PNG',
      });
      fs.unlinkSync(req.file.path);
      res.set('Content-Type', 'image/png');
      res.send(outputBuffer);
    } catch (err2) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'HEIC conversion failed', details: err2.toString() });
    }
  }
});

app.listen(3001, () => {
  console.log('HEIC conversion server running on http://localhost:3001');
});
