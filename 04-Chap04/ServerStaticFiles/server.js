import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path,{ dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function GetContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.html': 'text/html; charset=utf-8',
        '.css':  'text/css',
        '.js':   'application/javascript',
        '.json': 'application/json',
        '.png':  'image/png',
        '.jpg':  'image/jpeg',
        '.mp4':  'video/mp4',
        '.pdf':  'application/pdf',
    };

    return map[ext] || 'application/octet-stream'; // fallback → trigger download
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // 1. Tạo đường dẫn tuyệt đối, chống path traversal
    const filePath = path.join(__dirname, url.pathname, "public", url.pathname === "/" ? 'index.html': ""); // → /static/index.html nếu url là /static/ hoặc /static

    // ─── Bước 1: stat() — kiểm tra file TRƯỚC khi làm bất cứ gì ───
    fs.stat(filePath, (err, stats) => {
        // ─── Bước 2: phân loại lỗi → trả đúng HTTP code ───
        if (err) {
            switch (err.code) {
                case 'ENOENT':
                    //File ko tồn tại
                    res.statusCode = 404;
                    res.end ('File not found');
                    return;
                case 'EACCES':
                    //Không có quyền truy cập
                    res.statusCode = 403;
                    res.end('Forbidden');
                    return;
                default:
                    res.statusCode = 500;
                    res.end('Internal Server Error');
                    return;
            }
        }

        // stat() thành công → file tồn tại và đọc được
        // stats.size = kích thước chính xác tính bằng bytes
        
        // ─── Bước 3: set headers — PHẢI làm trước khi ghi body ───
        if (req.url === '/') {   
            switch (req.method) {
                case 'GET':
                    showForm(res, filePath, stats);
                    break;
                case 'POST':
                    handleSubmit(req, res);
                    break;
                default:
                    res.statusCode = 405;
                    res.end('Method Not Allowed');
            }
        }
        
    });
});

function showForm(res, filePath, stats) {
    res.writeHead(200, {
        'Content-Type': GetContentType(filePath),
        'Content-Length': stats.size, // ← browser dùng cái này cho progress bar
        'Last-Modified': stats.mtime.toUTCString(), // ← browser dùng để cache
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    // ─── Bước 5: handle lỗi xảy ra TRONG KHI đang stream ───
    // (ví dụ: disk bị unplug sau khi stat() đã xong)
    stream.on('error', (err) => {
        console.error('Stream error:', streamErr);
        // headers đã được gửi rồi, không set statusCode được nữa
        // chỉ có thể destroy connection
        res.destroy(); // Hủy kết nối ngay lập tức, ko gửi thêm dữ liệu nào nữa
    });
}

// ======================
// Handle POST data
// ======================
function handleSubmit(req, res) {
    let body = '';

    // Nhận từng chunk data
    req.on('data', chunk => {
        body += chunk.toString();
    });

    // Data nhận xong
    req.on('end', () => {
        console.log('Raw Body:', body);

        // Parse form-urlencoded
        const data = new URLSearchParams(body);

        console.log(data);

        const username = data.get('username');
        const email = data.get('email');

        res.writeHead(200, {
            'Content-Type': 'text/html'
        });

        res.end(`
            <h1>Form Submitted</h1>

            <p>Username: ${username}</p>
            <p>Email: ${email}</p>
        `);
    });
}

server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});