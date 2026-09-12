/**
 * Interactive Database GUI Router
 * Provides visual database inspection and JPG/JPEG data conversion
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const upload = require('../middlewares/upload');
const logger = require('../utils/logger');

// Serve interactive Database GUI HTML Page
router.get(['/', '/db-gui', '/api/db-gui'], async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const collections = isConnected ? await mongoose.connection.db.listCollections().toArray() : [];
    
    const collectionsSummary = {};
    if (isConnected) {
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        collectionsSummary[col.name] = count;
      }
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenLeaf - Database GUI Dashboard</title>
  <style>
    :root { --primary: #10b981; --dark: #0f172a; --card: #1e293b; --text: #f8fafc; }
    body { font-family: system-ui, -apple-system, sans-serif; background-color: var(--dark); color: var(--text); margin: 0; padding: 24px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }
    .badge { background: ${isConnected ? '#059669' : '#d97706'}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: var(--card); border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .card h3 { margin: 0 0 8px 0; font-size: 18px; color: var(--primary); }
    .card p { font-size: 28px; font-weight: bold; margin: 0; }
    .upload-box { background: var(--card); border: 2px dashed var(--primary); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; }
    input[type="file"] { display: none; }
    .btn { background: var(--primary); color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-block; margin-top: 12px; }
    .btn:hover { opacity: 0.9; }
    #previewContainer { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
    .img-card { background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155; padding: 8px; text-align: center; }
    .img-card img { max-width: 100%; max-height: 140px; object-fit: contain; border-radius: 4px; }
    pre { background: #090d16; padding: 12px; border-radius: 8px; overflow-x: auto; color: #a7f3d0; font-size: 13px; text-align: left; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌱 GreenLeaf Database GUI Access</h1>
    <span class="badge">${isConnected ? '● Connected to MongoDB' : '⚡ In-Memory Fallback Mode'}</span>
  </div>

  <h2>Database Collections Summary</h2>
  <div class="grid">
    ${Object.keys(collectionsSummary).length > 0 ? 
      Object.entries(collectionsSummary).map(([name, count]) => `
        <div class="card">
          <h3>📦 ${name}</h3>
          <p>${count} documents</p>
        </div>
      `).join('') : `
        <div class="card">
          <h3>📦 Memory Store</h3>
          <p>Active</p>
        </div>
      `
    }
  </div>

  <div class="upload-box">
    <h2>📸 JPG / JPEG Data & Image Converter to Database GUI</h2>
    <p>Upload any JPG/JPEG data file to automatically convert and inspect in Database GUI format.</p>
    <label class="btn" for="jpgInput">Select JPG/JPEG File</label>
    <input type="file" id="jpgInput" accept="image/jpeg,image/jpg,image/png,image/webp">
    <div id="previewContainer"></div>
  </div>

  <h2>Database Live Status JSON</h2>
  <pre>${JSON.stringify({ isConnected, collections: collectionsSummary, timestamp: new Date().toISOString() }, null, 2)}</pre>

  <script>
    document.getElementById('jpgInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/db-gui/convert-jpg', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const container = document.getElementById('previewContainer');
        container.innerHTML = \`
          <div class="img-card">
            <img src="\${data.dataUrl}" alt="Converted JPG Data">
            <p style="font-size: 12px; margin: 8px 0 0 0; color: #94a3b8;">\${data.filename} (\${data.format.toUpperCase()})</p>
            <p style="font-size: 11px; color: #10b981;">Converted to Base64 GUI Database Format</p>
          </div>
        \` + container.innerHTML;
      }
    });
  </script>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    logger.error('Error generating Database GUI:', error);
    res.status(500).json({ success: false, message: 'Failed to open Database GUI', error: error.message });
  }
});

// Endpoint to convert uploaded JPG/JPEG data to Base64 GUI format
router.post(['/convert-jpg', '/api/db-gui/convert-jpg'], upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No JPG/JPEG file provided' });
    }

    const fs = require('fs');
    const fileBuffer = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    res.json({
      success: true,
      message: 'JPG/JPEG data converted to Database GUI format',
      filename: req.file.originalname,
      format: req.file.mimetype.split('/')[1] || 'jpeg',
      sizeBytes: req.file.size,
      storageUrl: `/uploads/${req.file.filename}`,
      dataUrl: dataUrl
    });
  } catch (error) {
    logger.error('JPG conversion error:', error);
    res.status(500).json({ success: false, message: 'JPG data conversion failed', error: error.message });
  }
});

module.exports = router;
