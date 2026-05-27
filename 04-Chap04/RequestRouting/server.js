import http from 'http';
import querystring from 'querystring';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path,{ dirname} from 'path';
import busboy from 'busboy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
const maxFileSize = 10 * 1024 * 1024; // 2MB

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// ─── Sanitize filename — chống path traversal ─────────────────────────────────
function sanitizeFilename(filename) {
    return path.basename(filename)              // loại bỏ ../ hay /etc/passwd
               .replace(/[^a-zA-Z0-9._-]/g, '_') // chỉ giữ ký tự an toàn
               .slice(0, 255);                 // giới hạn độ dài
}

// ─── Thêm timestamp vào tên file — tránh overwrite ───────────────────────────
function uniqueFilename(filename) {
    const ext  = path.extname(filename);
    const base = path.basename(filename, ext);
    return `${base}-${Date.now()}${ext}`;
}

// ─── Handler upload ───────────────────────────────────────────────────────────
function handleUpload(req, res) {
    const fields = {}; // chứa text fields
    const files = []; // chứa metadata các file đã upload

    let fileCount = 0; // đếm file đang stream
    let busboyDone = false; // busboy đã finish chưa
    let hasError = false; // đã có lỗi chưa

    // ── tạo busboy instance ──────────────────────────────────────────────────
    const bb = busboy({
        headers: req.headers,
        limits: {
            fileSize: maxFileSize, // giới hạn mỗi file 10MB
            files: 5, // tối đa 5 file mỗi request
            fields: 20 // tối đa 20 text field
        }
    });

    // ── xử lý text field ────────────────────────────────────────────────────
    bb.on('field', (name, value) => {
        fields[name] = value;
        console.log(`[field] ${name}: ${value}`);
    });

    // ── xử lý file ──────────────────────────────────────────────────────────
    bb.on('file', (fieldName, fileStream, info) => {
        const { filename, mimeType } = info;

        // validate MIME type — chỉ nhận ảnh và PDF
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!allowedTypes.includes(mimeType)) {
            // drain stream để busboy không bị treo
            fileStream.resume();
            console.warn(`[skip] ${filename} - MIME không hợp lệ: ${mimetype}`);
            return;
        }

        const safeName = sanitizeFilename(filename);
        const finalName  = uniqueFilename(safeName);
        const savePath = path.join(uploadDir, finalName);

        console.log(`[file] nhận: ${filename} -> lưu: ${finalName} (${mimeType})`);

        fileCount++;
        const writeStream = fs.createWriteStream(savePath);

        // pipe: request stream → busboy → writeStream (disk)
        // không có byte nào qua RAM của bạn
        fileStream.pipe(writeStream);

        // ── busboy emit 'limit' nếu file vượt giới hạn ──────────────────────
        fileStream.on('limit', () => {
            console.error(`[error] ${filename} vượt quá giới hạn ${maxFileSize/1024/1024} MB`);
            fileStream.resume(); // drain phần còn lại
            writeStream.destroy(); // đóng writeStream
            fs.unlink(savePath, () => {}); // xoá file dở
            if (!hasError) {
                hasError = true;
                response(413, `File ${filename} vượt quá giới hạn ${maxFileSize/1024/1024} MB`);
            }
        });

        writeStream.on('error', err => {
            console.error(`[error] ghi file ${finalName}: ${err.message}`);
            if (!hasError) {
                hasError = true;
                response(500, `Lỗi lưu file ${filename}`);
            }
        });

        writeStream.on('finish', () => {
            fileCount--;
            files.push({
                fieldName,
                originalName: filename,
                saveAs: finalName,
                mimeType
            });

            console.log(`[file] ${filename} đã lưu thành công`);
            tryRespond();
        });
    });

    bb.on('finish', () => {
        console.log('[busboy] đã nhận xong tất cả data');
        busboyDone = true;
        tryRespond();
    });

    bb.on('error', err => {
        console.error(`[busboy error] ${err.message}`);
        if (!hasError) {
            hasError = true;
            respond(400, 'Lỗi parse multipart: ' + err.message);
        }
    });

    // ── pipe request vào busboy ──────────────────────────────────────────────
    req.pipe(bb);

    // ── chỉ respond khi busboy finish VÀ tất cả file đã ghi xong ────────────
    // (vì writeStream.finish có thể xảy ra sau bb.finish)
    function tryRespond() {
        if (!hasError) return;
        if (busboyDone && fileCount === 0) {
            respond(303, null);
        }
    }

    function respond(statusCode, errMessage) {
        if (!res.headerSent) return; // tránh gọi 2 lần

        if (errMessage) {
            res.writeHead(statusCode, {'Content-Type': 'text/plain; charset=utf-8'});
            res.end(errMessage);
            return;
        }

        const result = {
            messsage: 'Upload file thành công',
            fields,
            files: files.map(f => ({
                fieldName: f.fieldName,
                originalName: f.originalName,
                saveAs: f.saveAs,
                mimeType: f.mimeType
            })),
        }

        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8'});
        res.end(JSON.stringify(result, null, 2));
    }
}

function showForm(res) {
    const html = `
        <html>
            <body>
                <h1>Register Form</h1>

                <form method="POST" action="/" enctype="multipart/form-data">
                    <input 
                        type="text" 
                        name="username" 
                        placeholder="Enter username"
                    />

                    <br><br>

                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Enter email"
                    />

                    <br><br>

                    <input name="avatar"   type="file" />   <!-- file ảnh 2MB -->

                    <br><br>

                    <button type="submit">
                        Submit
                    </button>
                </form>
            </body>
        </html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
}

function saveFile(filePath) {
    
}

// ======================
// Handle POST data
// ======================
function handleSubmit(req, res) {
    let body = '';

    // Nhận từng chunk data
    req.on('data', chunk => {
        body += chunk.toString();
        console.log(`Received chunk: ${chunk}, length: ${chunk.length} bytes`);
        console.log(`body: ${body}, length: ${body.length} bytes`);
        if (body.length > 1e6) { // 1MB
            req.destroy(); // Ngắt kết nối nếu data quá lớn
            res.statusCode = 413; // Payload Too Large
            res.end('Payload Too Large');
        }
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

const server = http.createServer((req, res) => {
    //Route
    if (req.url === '/') {   
        switch (req.method) {
            case 'GET':
                showForm(res);
                break;
            case 'POST':
                handleUpload(req, res);
                break;
            default:
                res.statusCode = 405;
                res.end('Method Not Allowed');
                break;
        }        
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }    
});

server.listen(3000, () => {
    console.log('Server chạy tại http://localhost:3000');
    console.log(`Upload dir: ${uploadDir}`);
});