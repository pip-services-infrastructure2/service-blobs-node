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
exports.BlobsMemoryPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_4 = require("pip-services3-commons-nodex");
const pip_services3_data_nodex_1 = require("pip-services3-data-nodex");
class BlobsMemoryPersistence extends pip_services3_data_nodex_1.IdentifiableMemoryPersistence {
    constructor() {
        super();
        this._content = {};
        this._maxBlobSize = 100 * 1024;
    }
    configure(config) {
        super.configure(config);
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
    }
    matchString(value, search) {
        if (value == null && search == null)
            return true;
        if (value == null || search == null)
            return false;
        return value.toLowerCase().indexOf(search) >= 0;
    }
    matchSearch(item, search) {
        search = search.toLowerCase();
        if (this.matchString(item.name, search))
            return true;
        if (this.matchString(item.group, search))
            return true;
        return false;
    }
    composeFilter(filter) {
        filter = filter || new pip_services3_commons_nodex_1.FilterParams();
        let search = filter.getAsNullableString('search');
        let id = filter.getAsNullableString('id');
        let name = filter.getAsNullableString('name');
        let group = filter.getAsNullableString('group');
        let completed = filter.getAsNullableBoolean('completed');
        let expired = filter.getAsNullableBoolean('expired');
        let fromCreateTime = filter.getAsNullableDateTime('from_create_time');
        let toCreateTime = filter.getAsNullableDateTime('to_create_time');
        let now = new Date();
        return (item) => {
            if (search != null && !this.matchSearch(item, search))
                return false;
            if (id != null && id != item.id)
                return false;
            if (name != null && name != item.name)
                return false;
            if (group != null && group != item.group)
                return false;
            if (completed != null && completed != item.completed)
                return false;
            if (expired != null && expired == true && item.expire_time > now)
                return false;
            if (expired != null && expired == false && item.expire_time <= now)
                return false;
            if (fromCreateTime != null && item.create_time >= fromCreateTime)
                return false;
            if (toCreateTime != null && item.create_time < toCreateTime)
                return false;
            return true;
        };
    }
    getPageByFilter(correlationId, filter, paging) {
        const _super = Object.create(null, {
            getPageByFilter: { get: () => super.getPageByFilter }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.getPageByFilter.call(this, correlationId, this.composeFilter(filter), paging, null, null);
        });
    }
    markCompleted(correlationId, ids) {
        const _super = Object.create(null, {
            updatePartially: { get: () => super.updatePartially }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            for (let id of ids) {
                tasks.push(_super.updatePartially.call(this, correlationId, id, pip_services3_commons_nodex_2.AnyValueMap.fromTuples('completed', true)));
            }
            yield Promise.all(tasks);
        });
    }
    deleteById(correlationId, id) {
        const _super = Object.create(null, {
            deleteById: { get: () => super.deleteById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            delete this._content[id];
            return yield _super.deleteById.call(this, correlationId, id);
        });
    }
    deleteByIds(correlationId, ids) {
        const _super = Object.create(null, {
            deleteByIds: { get: () => super.deleteByIds }
        });
        return __awaiter(this, void 0, void 0, function* () {
            for (let id of ids)
                delete this._content[id];
            yield _super.deleteByIds.call(this, correlationId, ids);
        });
    }
    clear(correlationId) {
        const _super = Object.create(null, {
            clear: { get: () => super.clear }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this._content = {};
            yield _super.clear.call(this, correlationId);
        });
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
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (item.size != null && item.size > this._maxBlobSize) {
                throw new pip_services3_commons_nodex_4.BadRequestException(correlationId, 'BLOB_TOO_LARGE', 'Blob ' + item.id + ' exceeds allowed maximum size of ' + this._maxBlobSize).withDetails('blob_id', item.id)
                    .withDetails('size', item.size)
                    .withDetails('max_size', this._maxBlobSize);
            }
            item = yield _super.create.call(this, correlationId, item);
            let buffer = new Buffer([]);
            this._content[item.id] = buffer;
            return item.id;
        });
    }
    writeChunk(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = token;
            let oldBuffer = this._content[id];
            if (oldBuffer == null) {
                throw new pip_services3_commons_nodex_3.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id);
            }
            // Enforce maximum size
            let chunkLength = chunk ? chunk.length : 0;
            if (this._maxBlobSize > 0 && oldBuffer.length + chunkLength > this._maxBlobSize) {
                throw new pip_services3_commons_nodex_4.BadRequestException(correlationId, 'BLOB_TOO_LARGE', 'Blob ' + id + ' exceeds allowed maximum size of ' + this._maxBlobSize).withDetails('blob_id', id)
                    .withDetails('size', oldBuffer.length + chunkLength)
                    .withDetails('max_size', this._maxBlobSize);
            }
            let buffer = new Buffer("", "base64");
            if (chunk != null && chunk.length > 0)
                buffer = Buffer.from(chunk, 'base64');
            this._content[id] = Buffer.concat([oldBuffer, buffer]);
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
            let item;
            // Write last chunk of the blob
            yield this.writeChunk(correlationId, token, chunk);
            // Get blob info
            item = yield _super.getOneById.call(this, correlationId, id);
            if (item == null) {
                throw new pip_services3_commons_nodex_3.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id);
            }
            // Update blob info with size and create time
            let buffer = this._content[id];
            item.create_time = new Date();
            item.size = buffer != null ? buffer.length : 0;
            let res = yield _super.update.call(this, correlationId, item);
            return res;
        });
    }
    abortWrite(correlationId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = token;
            yield this.deleteById(correlationId, id);
        });
    }
    beginRead(correlationId, id) {
        const _super = Object.create(null, {
            getOneById: { get: () => super.getOneById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let oldBuffer = this._content[id];
            if (oldBuffer == null) {
                throw new pip_services3_commons_nodex_3.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id);
            }
            return yield _super.getOneById.call(this, correlationId, id);
        });
    }
    readChunk(correlationId, id, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            let oldBuffer = this._content[id];
            if (oldBuffer == null) {
                throw new pip_services3_commons_nodex_3.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id);
            }
            let result = oldBuffer.toString('base64', skip, skip + take);
            return result;
        });
    }
    endRead(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
}
exports.BlobsMemoryPersistence = BlobsMemoryPersistence;
//# sourceMappingURL=BlobsMemoryPersistence.js.map