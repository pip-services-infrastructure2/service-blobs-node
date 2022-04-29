const fs = require('fs');

import { ConfigParams } from 'pip-services3-commons-nodex';
import { JsonFilePersister } from 'pip-services3-data-nodex';
import { NotFoundException } from 'pip-services3-commons-nodex';

import { BlobsMemoryPersistence } from './BlobsMemoryPersistence';
import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { TempBlobStorage } from './TempBlobStorage';

export class BlobsFilePersistence extends BlobsMemoryPersistence {
	protected _persister: JsonFilePersister<BlobInfoV1>;
    protected _path: string = './data/blobs';
    protected _index: string = './data/blobs/index.json';
    protected _maxBlobSize: number = 100 * 1024;
    protected _storage: TempBlobStorage;

    public constructor(path?: string, index?: string) {
        super();

        this._path = path || this._path;
        this._index = index || this._path + '/index.json';

        this._storage = new TempBlobStorage(this._path);
        this._persister = new JsonFilePersister<BlobInfoV1>(this._index);
        this._loader = this._persister;
        this._saver = this._persister;
    }

    public configure(config: ConfigParams): void {
        config = new ConfigParams(config);
        this._storage.configure(config);

        this._path = config.getAsStringWithDefault('path', this._path);
        this._index = config.getAsStringWithDefault('index', this._path + '/index.json');
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);

        // Override and set configuration
        config.setAsObject('path', this._index);
        super.configure(config);
        this._persister.configure(config);
    }

    public async open(correlationId: string): Promise<void> {
        // Open temp blob storage
        await this._storage.open(correlationId);

        // Create folder if it doesn't exist
        if (!fs.existsSync(this._path))
            await fs.promises.mkdir(this._path);

        // Close index
        await super.open(correlationId);
    }

    public async close(correlationId: string): Promise<void> {
        // Close temp blob storage
        await this._storage.close(correlationId);

        // Close index.
        await super.close(correlationId);
    }

    protected makeFileName(id: string): string {
        return this._path + '/' + id + '.dat';
    }

    public isUriSupported(): boolean {
        return false;
    }

    public async getUri(correlationId: string, id: string): Promise<string> {
        return null;
    }

    public async beginWrite(correlationId: string, item: BlobInfoV1): Promise<string> {
        return await super.beginWrite(correlationId, item);
    }

    public async writeChunk(correlationId: string, token: string, chunk: string): Promise<string> {
        let id = token;
        chunk = chunk || "";
        let buffer = Buffer.from(chunk, 'base64');
        await this._storage.appendChunk(correlationId, id, buffer);

        return token;
    }

    public async endWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1> {
        let id = token;
        chunk = chunk || "";
        let buffer = Buffer.from(chunk, 'base64');
        let size = buffer.length;
        let append = false;
        let item: BlobInfoV1;

        // Get blob info
        item = await super.getOneById(correlationId, id);

        if (item == null) {
            throw new NotFoundException(
                correlationId,
                'BLOB_NOT_FOUND',
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id);
        }

        // Read current size and decide to append or to write from scratch
        let writtenSize = await this._storage.getChunksSize(correlationId, id);
        append = writtenSize > 0;
        size += writtenSize;

        // Append existing file and rename
        if (append) {
            // If some chunks already stored in temp file - append then upload the entire file
            this._storage.appendChunk(correlationId, id, buffer);
            let oldPath = this._storage.makeFileName(id);
            let newPath = this.makeFileName(id);
            await fs.promises.rename(oldPath, newPath);
        }

        // Write blob from scratch
        if (!append) {
            // If it's the first chunk then upload it without writing to temp file
            await fs.promises.writeFile(this.makeFileName(id), buffer);
        }

        buffer = this._content[id];
        item.create_time = new Date();
        item.size = size;

        return await super.update(correlationId, item);
    }
    
    public async abortWrite(correlationId: string, token: string): Promise<void> {
        let id = token;
        await super.deleteById(correlationId, id);
        await this._storage.deleteChunks(correlationId, id);
    }

    public async beginRead(correlationId: string, id: string): Promise<BlobInfoV1> {

        let filePath = this.makeFileName(id);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(
                correlationId, 
                'BLOB_NOT_FOUND', 
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id)
            .withDetails('path', filePath);
        }

        return await super.getOneById(correlationId, id);
    }

    public async readChunk(correlationId: string, id: string, skip: number, take: number): Promise<string> {

        let fHandler = await fs.promises.open(this.makeFileName(id), 'r');
        let buffer = Buffer.alloc(take);

        await fHandler.read(buffer, 0, take, skip);
        await fHandler.close();

        let result = buffer.toString('base64');

        return result;
    }

    public async endRead(correlationId: string, id: string): Promise<void> {
        return null;
    }

    public async deleteById(correlationId: string, id: string): Promise<BlobInfoV1> {
        let item: BlobInfoV1;
        try {
            await super.deleteById(correlationId, id);
            await fs.promises.unlink(this.makeFileName(id));
            item = await super.deleteById(correlationId, id);
        } catch(err) {
            if (err == null || err.code != 'ENOENT') throw err;
        }

        return item;
    }

    public async deleteByIds(correlationId: string, ids: string[]): Promise<void> {
        let tasks = [];
        try {
            await super.deleteByIds(correlationId, ids);
            for (let id of ids) {
                tasks.push(
                    fs.promises.unlink(this.makeFileName(id))
                );
            }
            await Promise.all(tasks);
        } catch (err) {
            if (err == null || err.code != 'ENOENT') throw err;
        }
    }

    public async clear(correlationId: string): Promise<void> {
        await super.clear(correlationId);

        let files = await fs.promises.readdir(this._path);
        files = files.filter((file) => file.endsWith('.dat'));

        let tasks = [];

        for (let file of files) {
            tasks.push(
                fs.promises.unlink(this._path + '/' + file)
            );
        }
        
        await Promise.all(tasks);
    }
}