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
exports.TempBlobStorage = void 0;
const fs = require('fs');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
class TempBlobStorage {
    constructor(path) {
        this._path = './data/temp';
        this._maxBlobSize = 100 * 1024;
        this._minChunkSize = 5 * 1024 * 1024;
        this._cleanupTimeout = 9000000;
        this._writeTimeout = 9000000;
        this._cleanupInterval = null;
        this._opened = false;
        this._path = path || this._path;
    }
    configure(config) {
        this._path = config.getAsStringWithDefault('temp_path', this._path);
        this._minChunkSize = config.getAsLongWithDefault('options.min_chunk_size', this._minChunkSize);
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
        this._cleanupTimeout = config.getAsLongWithDefault('options.cleanup_timeout', this._cleanupTimeout);
        this._writeTimeout = config.getAsLongWithDefault('options.write_timeout', this._writeTimeout);
    }
    isOpen() {
        return this._opened;
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._opened == true) {
                return;
            }
            // Create filter if it doesn't exist
            if (!fs.existsSync(this._path))
                yield fs.promises.mkdir(this._path);
            // Restart cleanup process
            if (this._cleanupInterval)
                clearInterval(this._cleanupInterval);
            this._cleanupInterval = setInterval(() => {
                this.cleanup(null);
            }, this._cleanupTimeout);
            this._opened = true;
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Stop cleanup process
            if (this._cleanupInterval) {
                clearInterval(this._cleanupInterval);
                this._cleanupInterval = null;
            }
            this._opened = false;
        });
    }
    makeFileName(id) {
        return this._path + '/' + id + '.tmp';
    }
    getChunksSize(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let size;
            let stats;
            // Read temp size
            try {
                stats = yield fs.promises.stat(this.makeFileName(id));
            }
            catch (err) {
                if (err == null || err.code != 'ENOENT')
                    throw err;
            }
            size = stats != null ? stats.size : 0;
            return size;
        });
    }
    appendChunk(correlationId, id, buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            // Enforce max blob size
            let size = yield this.getChunksSize(correlationId, id);
            size += buffer.length;
            if (size > this._maxBlobSize) {
                throw new pip_services3_commons_nodex_1.BadRequestException(correlationId, 'BLOB_TOO_LARGE', 'Blob ' + id + ' exceeds allowed maximum size of ' + this._maxBlobSize).withDetails('blob_id', id)
                    .withDetails('size', size)
                    .withDetails('max_size', this._maxBlobSize);
            }
            yield fs.promises.appendFile(this.makeFileName(id), buffer);
            return size;
        });
    }
    readChunks(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let data;
            try {
                data = yield fs.promises.readFile(this.makeFileName(id));
            }
            catch (err) {
                if (err == null || err.code != 'ENOENT')
                    throw err;
            }
            return data;
        });
    }
    deleteChunks(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs.promises.unlink(this.makeFileName(id));
            }
            catch (err) {
                if (err == null || err.code != 'ENOENT')
                    throw err;
            }
        });
    }
    cleanup(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let cutoffTime = new Date().getTime() - this._writeTimeout;
            let files = yield fs.promises.readdir(this._path);
            files = files.filter((file) => file.endsWith('.tmp'));
            let tasks = [];
            for (let file of files) {
                tasks.push(new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let path = this._path + '/' + file;
                        let stats = yield fs.promises.stat(path);
                        if (stats != null && stats.birthtime.getTime() < cutoffTime)
                            yield fs.promises.unlink(path);
                        resolve(null);
                    }
                    catch (err) {
                        reject(err);
                    }
                })));
            }
            yield Promise.all(tasks);
        });
    }
    clear(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
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
exports.TempBlobStorage = TempBlobStorage;
//# sourceMappingURL=TempBlobStorage.js.map