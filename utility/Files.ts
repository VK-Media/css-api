import * as fs from 'fs';

class Files {
    public static createDirectory(path: string): boolean {
        fs.mkdir(path, { recursive: true }, err => {
            if (err) return false;
        });

        return true;
    }

    public static directoryExists(path: string): boolean {
        return fs.existsSync(path)
    }

    public static isDir(path: string): boolean {
        return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
    }

    public static isFile(path: string): boolean {
        return fs.existsSync(path) && fs.lstatSync(path).isFile();
    }
}

export default Files;