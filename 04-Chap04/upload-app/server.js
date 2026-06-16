import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path,{ dirname} from 'path';
import busboy from 'busboy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
const metaData_File = path.join(__dirname, 'upload.json');
const maxFileSize = 10 * 1024 * 1024; // 2MB
let filePath;

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

if (fs.existsSync(metaData_File)){
    fs.writeFileSync(metaData_File,'[]', 'utf-8');
}

// ─── Helpers metadata (lưu vào file JSON) ─────────────────────────────────────
function readUploads() {
    try {
        return JSON.parse(fs.readFileSync(metaData_File, 'utf-8'));
    }
    catch {
        return [];
    }
}

function saveUpload(entry){
    return new Promise ((resolve, reject) => {
        try {
            const uploads = readUploads();
            entry.map(item => {
                uploads.unshift(item);
            });
            
            fs.writeFile(metaData_File, JSON.stringify(uploads, null, 2), 'utf-8', (err) => {
                if (err) reject(err);
                resolve();
            })
        }
        catch (err) {
            reject(err);
        }
    });
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
            console.warn(`[skip] ${filename} - MIME không hợp lệ: ${mimeType}`);
            return;
        }

        const safeName = sanitizeFilename(filename);
        const finalName = uniqueFilename(safeName);
        const savePath = path.join(uploadDir, finalName);

        console.log(`[file] nhận: ${filename} -> lưu: ${finalName} (${mimeType})`);

        fileCount++;
        let fileSize = 0;
        const writeStream = fs.createWriteStream(savePath);

        fileStream.on('data', (chunk) => { fileSize += chunk.length; });

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
    async  function tryRespond() {
        if (hasError) return;
        if (!busboyDone || fileCount !== 0) return;

        //validate username
        const userName = (fields.username || '').trim();
        if (!userName) {
            return respond(400, 'invalid username');
        }

        if(files.length === 0) {
            return respond(400, "None of files can upload");
        }

        // ── LƯU METADATA VÀO FILE JSON (async) ───────────────────────────────
        // ĐÂY là lý do redirect phải nằm trong try/catch bên dưới
        // không phải bên ngoài — phải chờ saveUpload() xong mới redirect
        try {
            await saveUpload(files);
            // ✅ lưu xong → redirect
            // nếu để respond ở ngoài try → user redirect trước khi ghi JSON xong
            respond(303, null);
        }
        catch (err) {
            console.error("[saveUpload error", err.message);
            respond(500, "Save files fail");
        }
    }

    function respond(statusCode, errMessage) {
        if (res.headersSent) return; // tránh gọi 2 lần
        
        if (statusCode == 303) {
            // Post/Redirect/Get — tránh resubmit khi F5
            const result = {
                messsage: 'Upload files success',
                fields,
                files: files.map(f => ({
                    fieldName: f.fieldName,
                    originalName: f.originalName,
                    saveAs: f.saveAs,
                    mimeType: f.mimeType
                })),
            }

            res.writeHead(statusCode, { 'Location': req.url});
            res.end();
            return;            
        }
        
        res.writeHead(statusCode, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end(errMessage);
    }
}

async function showForm(res, filePath) {
    const html = fs.createReadStream(filePath, 'utf-8');
    const stat = await fs.promises.stat(filePath);
    res.writeHead(200, {
        'Content-Type': GetContentType(filePath),
        'Content-Length': stat.size, // ← browser dùng cái này cho progress bar
        'Last-Modified': stat.mtime.toUTCString(), // ← browser dùng để cache
    });
    html.pipe(res);
    res.end(html);
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

function GetContentType (filePath) {
    const extName = path.extname(filePath).toLowerCase();
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

    return map[extName] || 'application/octet-stream'; // fallback → trigger download
}

const server = http.createServer((req, res) => {
    if (!checkStaticFileExist(req, res)) return;

    //Route
    if (req.url === '/') {   
        switch (req.method) {
            case 'GET':
                showForm(res, filePath);
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

function checkStaticFileExist (req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathName = decodeURIComponent(url.pathname);

        // 1. Tạo đường dẫn tuyệt đối, chống path traversal
        filePath = path.normalize(
            path.join(
                publicDir, 
                url.pathname === "/" 
                    ? "index.html"
                    : ""
            )
        );

        if (!filePath.startsWith(publicDir)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return false;
        }

        // ─── Bước 1: stat() — kiểm tra file TRƯỚC khi làm bất cứ gì ───
        fs.stat(filePath, (err, stats) => {
            if (err) {
                switch (err.code) {
                    case 'ENOENT':
                        //File ko tồn tại
                        res.statusCode = 404;
                        res.end('File không tồn tại');
                        return false;
                    case 'EACCES':
                        res.statusCode = 403;
                        res.end('Không có quyền truy cập file');
                        return false;
                    default:
                        res.statusCode = 500;
                        res.end('Lỗi không xác định');
                        return false;
                }                
            }
        });

        return true;
    } 
    catch (err) {
        console.error(`Error: ${err.message}`);
        return false;
    }   
    
}

server.listen(3000, () => {
    console.log('Server chạy tại http://localhost:3000');
    console.log(`Upload dir: ${uploadDir}`);
});