import http from 'http';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

//Khai báo biến lưu đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function hadError(err, res){
    console.log(err);
    res.end('Server error');
}

function formatHTML(titles, tmp, res){
    var html = tmp.replace('%', titles.join('</li><li>'));
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
}

function getTemplate(titles, res){
    fs.readFile(path.join(__dirname, "template.html"), function (err, data){
        if (err)
            hadError(err, res);
        else{
            formatHTML(titles, data.toString(), res);
        }
    });
}

function getTitles(req, res){
    if (req.url === "/"){
        fs.readFile(path.join(__dirname, "titles.json"), function (err, data){
            if (err){
                hadError(err, res);
            }
            else {
                var titles = JSON.parse(data.toString());
                getTemplate(titles, res);
            }
        });
    }
}

var server = http.createServer(function (req, res){
    getTitles(req, res);
});

server.listen(8000, () => console.log("Server is running on port 8000"));