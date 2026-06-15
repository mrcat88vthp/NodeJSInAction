import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import http from 'http';

const server = http.createServer((req, res) => {
    //1. Tải tảng HTML Upload
    if (req.method === 'GET' && req.url === '/'){
        res.writeHead(200, { 'content-type': 'text/html'});
        res.end(`
            <form method="POST" action="/upload" enctype="multipart/form-data">
                <input type="text"  name="productName" placeholder="Tên sản phẩm">
                <input type="file"  name="image">
                <button>Upload</button>
            </form>
        `);

        return;
    }

    if (req.method === 'POST' && req.url === '/upload'){
        
    }
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});