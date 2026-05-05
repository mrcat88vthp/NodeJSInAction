import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path,{ dirname} from 'path';
import { da } from '@faker-js/faker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var server = http.createServer(function(request, response){    
    if (request.url === "/"){
        fs.readFile(path.join(__dirname, "titles.json"), function(err, data){
            if (err){
                console.log(err);
                response.end("Server Error");
            }
            else {
                var titles = JSON.parse(data.toString());

                fs.readFile(path.join(__dirname, "template.html"), function (err, data){
                    if(err){
                        console.log(err);
                        response.end("Server Error");
                    }
                    else{
                        var tmp = data.toString();
                        var html = tmp.replace("%", titles.join("</li><li>"));
                        response.writeHead(200, { "Content-Type": "text/html"});
                        response.end(html);
                    }
                });
            }
        });
    }
});

server.listen(8000, () => console.log("Server is running on port 8000"));