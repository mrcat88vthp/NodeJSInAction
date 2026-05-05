import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.get('/Images', (req, res) => {
    const imagePath = path.join(__dirname, 'test.jpg');
    res.sendFile(imagePath);
});

app.listen(3000, () => console.log('Server is running port 3000'));