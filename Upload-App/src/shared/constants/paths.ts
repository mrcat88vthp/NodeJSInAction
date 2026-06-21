import path from "node:path";

export const Paths = {
    rootPath: process.cwd(),

    uploadPath: path.join(process.cwd(), 'uploads'),

    publicPath: path.join(process.cwd(), 'public'),
}