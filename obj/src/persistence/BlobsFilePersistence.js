"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobsFilePersistence = void 0;
const fs = require('fs');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_data_nodex_1 = require("pip-services3-data-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const BlobsMemoryPersistence_1 = require("./BlobsMemoryPersistence");
const TempBlobStorage_1 = require("./TempBlobStorage");
class BlobsFilePersistence extends BlobsMemoryPersistence_1.BlobsMemoryPersistence {
    constructor(path, index) {
        super();
        this._path = './data/blobs';
        this._index = './data/blobs/index.json';
        this._maxBlobSize = 100 * 1024;
        this._path = path || this._path;
        this._index = index || this._path + '/index.json';
        this._storage = new TempBlobStorage_1.TempBlobStorage(this._path);
        this._persister = new pip_services3_data_nodex_1.JsonFilePersister(this._index);
        this._loader = this._persister;
        this._saver = this._persister;
    }
    configure(config) {
        config = new pip_services3_commons_nodex_1.ConfigParams(config);
        this._storage.configure(config);
        this._path = config.getAsStringWithDefault('path', this._path);
        this._index = config.getAsStringWithDefault('index', this._path + '/index.json');
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
        // Override and set configuration
        config.setAsObject('path', this._index);
        super.configure(config);
        this._persister.configure(config);
    }
    open(correlationId) {
        const _super = Object.create(null, {
            open: { get: () => super.open }
        });
        return __awaiter(this, void 0, void 0, function* () {
            // Open temp blob storage
            yield this._storage.open(correlationId);
            // Create folder if it doesn't exist
            if (!fs.existsSync(this._path))
                yield fs.promises.mkdir(this._path);
            // Close index
            yield _super.open.call(this, correlationId);
        });
    }
    close(correlationId) {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            // Close temp blob storage
            yield this._storage.close(correlationId);
            // Close index.
            yield _super.close.call(this, correlationId);
        });
    }
    makeFileName(id) {
        return this._path + '/' + id + '.dat';
    }
    isUriSupported() {
        return false;
    }
    getUri(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    beginWrite(correlationId, item) {
        const _super = Object.create(null, {
            beginWrite: { get: () => super.beginWrite }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.beginWrite.call(this, correlationId, item);
        });
    }
    writeChunk(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = token;
            chunk = chunk || "";
            let buffer = Buffer.from(chunk, 'base64');
            yield this._storage.appendChunk(correlationId, id, buffer);
            return token;
        });
    }
    endWrite(correlationId, token, chunk) {
        const _super = Object.create(null, {
            getOneById: { get: () => super.getOneById },
            update: { get: () => super.update }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let id = token;
            chunk = chunk || "";
            let buffer = Buffer.from(chunk, 'base64');
            let size = buffer.length;
            let append = false;
            let item;
            // Get blob info
            item = yield _super.getOneById.call(this, correlationId, id);
            if (item == null) {
                throw new pip_services3_commons_nodex_2.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id);
            }
            // Read current size and decide to append or to write from scratch
            let writtenSize = yield this._storage.getChunksSize(correlationId, id);
            append = writtenSize > 0;
            size += writtenSize;
            // Append existing file and rename
            if (append) {
                // If some chunks already stored in temp file - append then upload the entire file
                this._storage.appendChunk(correlationId, id, buffer);
                let oldPath = this._storage.makeFileName(id);
                let newPath = this.makeFileName(id);
                yield fs.promises.rename(oldPath, newPath);
            }
            // Write blob from scratch
            if (!append) {
                // If it's the first chunk then upload it without writing to temp file
                yield fs.promises.writeFile(this.makeFileName(id), buffer);
            }
            buffer = this._content[id];
            item.create_time = new Date();
            item.size = size;
            return yield _super.update.call(this, correlationId, item);
        });
    }
    abortWrite(correlationId, token) {
        const _super = Object.create(null, {
            deleteById: { get: () => super.deleteById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let id = token;
            yield _super.deleteById.call(this, correlationId, id);
            yield this._storage.deleteChunks(correlationId, id);
        });
    }
    beginRead(correlationId, id) {
        const _super = Object.create(null, {
            getOneById: { get: () => super.getOneById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let filePath = this.makeFileName(id);
            if (!fs.existsSync(filePath)) {
                throw new pip_services3_commons_nodex_2.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id)
                    .withDetails('path', filePath);
            }
            return yield _super.getOneById.call(this, correlationId, id);
        });
    }
    readChunk(correlationId, id, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            let fHandler = yield fs.promises.open(this.makeFileName(id), 'r');
            let buffer = Buffer.alloc(take);
            yield fHandler.read(buffer, 0, take, skip);
            yield fHandler.close();
            let result = buffer.toString('base64');
            return result;
        });
    }
    endRead(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    deleteById(correlationId, id) {
        const _super = Object.create(null, {
            deleteById: { get: () => super.deleteById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let item;
            try {
                yield _super.deleteById.call(this, correlationId, id);
                yield fs.promises.unlink(this.makeFileName(id));
                item = yield _super.deleteById.call(this, correlationId, id);
            }
            catch (err) {
                if (err == null || err.code != 'ENOENT')
                    throw err;
            }
            return item;
        });
    }
    deleteByIds(correlationId, ids) {
        const _super = Object.create(null, {
            deleteByIds: { get: () => super.deleteByIds }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            try {
                yield _super.deleteByIds.call(this, correlationId, ids);
                for (let id of ids) {
                    tasks.push(fs.promises.unlink(this.makeFileName(id)));
                }
                yield Promise.all(tasks);
            }
            catch (err) {
                if (err == null || err.code != 'ENOENT')
                    throw err;
            }
        });
    }
    clear(correlationId) {
        const _super = Object.create(null, {
            clear: { get: () => super.clear }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.clear.call(this, correlationId);
            let files = yield fs.promises.readdir(this._path);
            files = files.filter((file) => file.endsWith('.dat'));
            let tasks = [];
            for (let file of files) {
                tasks.push(fs.promises.unlink(this._path + '/' + file));
            }
            yield Promise.all(tasks);
        });
    }
}
exports.BlobsFilePersistence = BlobsFilePersistence;
//# sourceMappingURL=BlobsFilePersistence.js.map