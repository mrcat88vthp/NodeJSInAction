import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const Paths = {
    rootPath: path.resolve(__dirname,),

    uploadPath: path.join(__dirname, 'uploads'),

    publicPath: path.join(__dirname, 'public'),

    metadataFilePath: path.join(__dirname, 'uploads', 'metadata.json')
}