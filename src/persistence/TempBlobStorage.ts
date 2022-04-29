const fs = require('fs');

import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';
import { BadRequestException } from 'pip-services3-commons-nodex';

export class TempBlobStorage implements IConfigurable, IOpenable, ICleanable {
    private _path: string = './data/temp';
    private _maxBlobSize: number = 100 * 1024;
    private _minChunkSize: number = 5 * 1024 * 1024;
    private _cleanupTimeout: number = 9000000;
    private _writeTimeout: number = 9000000;
    private _cleanupInterval: any = null;
    private _opened: boolean = false;

    public constructor(path?: string) {
        this._path = path || this._path;
    }

    public configure(config: ConfigParams): void {
        this._path = config.getAsStringWithDefault('temp_path', this._path);
        this._minChunkSize = config.getAsLongWithDefault('options.min_chunk_size', this._minChunkSize);
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
        this._cleanupTimeout = config.getAsLongWithDefault('options.cleanup_timeout', this._cleanupTimeout);
        this._writeTimeout = config.getAsLongWithDefault('options.write_timeout', this._writeTimeout);
    }

    public isOpen(): boolean {
        return this._opened;
    }

    public async open(correlationId: string): Promise<void> {
        if (this._opened == true) {
            return;
        }

        // Create filter if it doesn't exist
        if (!fs.existsSync(this._path))
            await fs.promises.mkdir(this._path);

        // Restart cleanup process
        if (this._cleanupInterval)
            clearInterval(this._cleanupInterval);

        this._cleanupInterval = setInterval(() => {
            this.cleanup(null);
        }, this._cleanupTimeout);

        this._opened = true;
    }

    public async close(correlationId: string): Promise<void> {
        // Stop cleanup process
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }

        this._opened = false;
    }

    public makeFileName(id: string): string {
        return this._path + '/' + id + '.tmp';
    }

    public async getChunksSize(correlationId: string, id: string): Promise<number> {
        let size: number;
        let stats: any;

        // Read temp size
        try {
            stats = await fs.promises.stat(this.makeFileName(id));
        } catch(err) {
            if (err == null || err.code != 'ENOENT') throw err;
        }

        size = stats != null ? stats.size : 0;
        return size;
    }

    public async appendChunk(correlationId: string, id: string, buffer: Buffer): Promise<number> {

        // Enforce max blob size
        let size = await this.getChunksSize(correlationId, id);
        size += buffer.length;

        if (size > this._maxBlobSize) {
            throw new BadRequestException(
                correlationId,
                'BLOB_TOO_LARGE',
                'Blob ' + id + ' exceeds allowed maximum size of ' + this._maxBlobSize
            ).withDetails('blob_id', id)
                .withDetails('size', size)
                .withDetails('max_size', this._maxBlobSize);
        }

        await fs.promises.appendFile(this.makeFileName(id), buffer);

        return size;
    }

    public async readChunks(correlationId: string, id: string): Promise<Buffer> {
        let data: Buffer;
        try {
            data = await fs.promises.readFile(this.makeFileName(id));
        } catch(err) {
            if (err == null || err.code != 'ENOENT') throw err;
        }

        return data;
    }

    public async deleteChunks(correlationId: string, id: string): Promise<void> {
        try {
            await fs.promises.unlink(this.makeFileName(id));
        } catch (err) {
            if (err == null || err.code != 'ENOENT') throw err;
        }
    }

    public async cleanup(correlationId: string): Promise<void> {
        let cutoffTime = new Date().getTime() - this._writeTimeout;

        let files = await fs.promises.readdir(this._path);
        files = files.filter((file: string) => file.endsWith('.tmp'));
        
        let tasks = [];

        for (let file of files) {
            tasks.push(
                new Promise<any>(async (resolve, reject) => {
                    try {
                        let path = this._path + '/' + file;
                        let stats = await fs.promises.stat(path);
                        if (stats != null && stats.birthtime.getTime() < cutoffTime)
                            await fs.promises.unlink(path);
                        resolve(null);
                    } catch (err) {
                        reject(err);
                    }
                })
            );
        }

        await Promise.all(tasks);
    }

    public async clear(correlationId: string): Promise<void> {
        let files = await fs.promises.readdir(this._path);
        files = files.filter((file: string) => file.endsWith('.dat'));

        let tasks = [];

        for (let file of files) {
            tasks.push(fs.promises.unlink(this._path + '/' + file)) ;   
        }

        await Promise.all(tasks);
    }

}