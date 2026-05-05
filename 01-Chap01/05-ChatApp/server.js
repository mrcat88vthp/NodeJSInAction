import http from 'http';
import fs from 'fs';
import path, { dirname } from 'path';
import mime from 'mime';
import { fileURLToPath } from 'url';
import { listen as ChatServerListen } from './lib/chat_server.js';

//const
const cache = {}; //cache object is where the contents of cached files are stored.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Hàm gửi thông báo lỗi
function send404(response){
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: Resource not found');
    response.end();
}

//Hàm gửi file
function sendFile(response, filePath, fileContents){
    response.writeHead(200, {
        'Content-Type': mime.getType(filePath)
    });
    response.end(fileContents);
}

//Hàm phục vụ file tĩnh.
function serveStatic(response, cache, absPath){
    if(cache[absPath])
        sendFile(response, absPath, cache[absPath]);
    else{
        fs.access(absPath, fs.constants.F_OK, (error) => {
            if (error)
                send404(response);
            else {
                fs.readFile(absPath, (err, data) => {
                    if (err){
                        send404(response);
                    }
                    else{
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                })                
            }
        });
    }
}

const server = http.createServer(function(request, response){
    let filePath;
    if (request.url === '/'){
        filePath = 'public/index.html';
    }
    else{
        filePath = 'public' + request.url;
    }

    let absPath = path.join(__dirname, filePath);
    serveStatic(response, cache, absPath);
});

//Gắn socket.io vào HTTP server
ChatServerListen(server);

server.listen(3000, () => {
    console.log('Server listening on port 3000 ');
});