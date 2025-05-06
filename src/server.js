import express from 'express';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

// SSL certificate configuration
const options = {
  key: readFileSync(join(__dirname, '../ssl/key.pem')),
  cert: readFileSync(join(__dirname, '../ssl/cert.pem'))
};

// Create HTTPS server
const server = createServer(options, app);

// Start server
server.listen(443, () => {
  console.log('HTTPS Server running on port 443');
});