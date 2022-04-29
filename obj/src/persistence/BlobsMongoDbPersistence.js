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
exports.BlobsMongoDbPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const pip_services3_mongodb_nodex_1 = require("pip-services3-mongodb-nodex");
const pip_services3_commons_nodex_4 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_5 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_6 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_7 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_8 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_9 = require("pip-services3-commons-nodex");
const TempBlobStorage_1 = require("./TempBlobStorage");
class BlobsMongoDbPersistence extends pip_services3_mongodb_nodex_1.MongoDbPersistence {
    constructor() {
        super('blobs');
        this._storage = new TempBlobStorage_1.TempBlobStorage('./data/temp');
        this._maxBlobSize = 100 * 1024;
        this._maxPageSize = 100;
    }
    configure(config) {
        super.configure(config);
        this._storage.configure(config);
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
    }
    open(correlationId) {
        const _super = Object.create(null, {
            open: { get: () => super.open }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.open.call(this, correlationId);
            // Open temp blob storage
            yield this._storage.open(correlationId);
            let mongo = require('mongodb');
            this._GridStore = mongo.GridStore;
        });
    }
    close(correlationId) {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            // Close temp blob storage
            yield this._storage.close(correlationId);
            this._GridStore = null;
            yield _super.close.call(this, correlationId);
        });
    }
    composeFilter(filter) {
        filter = filter || new pip_services3_commons_nodex_7.FilterParams();
        let criteria = [];
        let search = filter.getAsNullableString('search');
        if (search != null) {
            let searchRegex = new RegExp(search, "i");
            let searchCriteria = [];
            searchCriteria.push({ 'metadata.name': { $regex: searchRegex } });
            searchCriteria.push({ 'metadata.group': { $regex: searchRegex } });
            criteria.push({ $or: searchCriteria });
        }
        let id = filter.getAsNullableString('id');
        if (id != null)
            criteria.push({ 'filename': id });
        let name = filter.getAsNullableString('name');
        if (name != null)
            criteria.push({ 'metadata.name': name });
        let group = filter.getAsNullableString('group');
        if (group != null)
            criteria.push({ 'metadata.group': group });
        let completed = filter.getAsNullableBoolean('completed');
        if (completed != null)
            criteria.push({ 'metadata.completed': completed });
        let expired = filter.getAsNullableBoolean('expired');
        if (expired != null) {
            let now = new Date();
            if (expired)
                criteria.push({ 'metadata.expire_time': { $lte: now } });
            else
                criteria.push({ 'metadata.expire_time': { $gt: now } });
        }
        let fromCreateTime = filter.getAsNullableDateTime('from_create_time');
        if (fromCreateTime != null)
            criteria.push({ 'uploadTime': { $gte: fromCreateTime } });
        let toCreateTime = filter.getAsNullableDateTime('to_create_time');
        if (toCreateTime != null)
            criteria.push({ 'uploadTime': { $lt: toCreateTime } });
        return criteria.length > 0 ? { $and: criteria } : {};
    }
    getPageByFilter(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
            let criteria = this.composeFilter(filter);
            // Adjust max item count based on configuration
            paging = paging || new pip_services3_commons_nodex_8.PagingParams();
            let skip = paging.getSkip(-1);
            let take = paging.getTake(this._maxPageSize);
            let pagingEnabled = paging.total;
            // Configure options
            let options = {};
            if (skip >= 0)
                options.skip = skip;
            options.limit = take;
            let items = yield new Promise((resolve, reject) => {
                collection.find(criteria, options).toArray((err, items) => {
                    if (err == null)
                        resolve(items);
                    else
                        reject(err);
                });
            });
            if (items != null) {
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._collectionName);
            }
            items = items || [];
            items = items.map(this.convertToPublic);
            let count = null;
            if (pagingEnabled) {
                count = yield new Promise((resolve, reject) => {
                    collection.countDocuments(filter, (err, count) => {
                        if (err == null)
                            resolve(count);
                        else
                            reject(err);
                    });
                });
            }
            items = items.map((item) => {
                return this.gridToInfo(item);
            });
            return new pip_services3_commons_nodex_9.DataPage(items, count);
        });
    }
    getListByIds(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
            let criteria = {
                filename: { $in: ids }
            };
            // Configure options
            let options = {};
            let items = yield new Promise((resolve, reject) => {
                collection.find(criteria, options).toArray((err, items) => {
                    if (err == null)
                        resolve(items);
                    else
                        reject(err);
                });
            });
            if (items != null) {
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._collectionName);
            }
            items = items || [];
            items = items.map((item) => {
                return this.gridToInfo(item);
            });
            return items;
        });
    }
    getOneById(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
            let criteria = {
                filename: id
            };
            let item = yield new Promise((resolve, reject) => {
                collection.findOne(criteria, (err, item) => {
                    if (err == null)
                        resolve(item);
                    else
                        reject(err);
                });
            });
            if (item == null) {
                this._logger.trace(correlationId, "Nothing found from %s with id = %s", this._collectionName, id);
            }
            else {
                this._logger.trace(correlationId, "Retrieved from %s with id = %s", this._collectionName, id);
            }
            item = this.gridToInfo(item);
            return item;
        });
    }
    update(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
            let criteria = {
                filename: item.id
            };
            let doc = {
                $set: {
                    'metadata.name': item.name,
                    'metadata.group': item.group,
                    'metadata.completed': item.completed,
                    'metadata.expire_time': item.expire_time
                }
            };
            let options = {
                new: true
            };
            let res = yield new Promise((resolve, reject) => {
                collection.findAndModify(criteria, [], doc, options, (err, item) => {
                    if (err != null)
                        reject(err);
                    if (item == null || item.value == null)
                        resolve(null);
                    resolve(item);
                });
            });
            item = this.gridToInfo(res.value);
            return item;
        });
    }
    markCompleted(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
            let criteria = {
                filename: { $in: ids }
            };
            let doc = {
                $set: {
                    'metadata.completed': true
                }
            };
            let options = {
                multi: true
            };
            yield new Promise((resolve, reject) => {
                collection.update(criteria, doc, options, (err) => {
                    if (err)
                        reject(err);
                    resolve(null);
                });
            });
        });
    }
    isUriSupported() {
        return false;
    }
    getUri(correlationId, id) {
        return null;
    }
    infoToToken(item) {
        let data = pip_services3_commons_nodex_1.ConfigParams.fromValue(item);
        return data.toString();
    }
    tokenToInfo(token) {
        let data = pip_services3_commons_nodex_1.ConfigParams.fromString(token);
        return {
            id: data.getAsNullableString('id'),
            group: data.getAsNullableString('group'),
            name: data.getAsNullableString('name'),
            size: data.getAsNullableLong('size'),
            content_type: data.getAsNullableString('content_type'),
            create_time: data.getAsNullableDateTime('create_time'),
            expire_time: data.getAsNullableDateTime('expire_time'),
            completed: data.getAsNullableBoolean('completed')
        };
    }
    beginWrite(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.size != null && item.size > this._maxBlobSize) {
                throw new pip_services3_commons_nodex_2.BadRequestException(correlationId, 'BLOB_TOO_LARGE', 'Blob ' + item.id + ' exceeds allowed maximum size of ' + this._maxBlobSize).withDetails('blob_id', item.id)
                    .withDetails('size', item.size)
                    .withDetails('max_size', this._maxBlobSize);
            }
            item.id = item.id || pip_services3_commons_nodex_4.IdGenerator.nextLong();
            let token = this.infoToToken(item);
            return token;
        });
    }
    writeChunk(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            let item = this.tokenToInfo(token);
            chunk = chunk || "";
            let buffer = Buffer.from(chunk, 'base64');
            yield this._storage.appendChunk(correlationId, item.id, buffer);
            return token;
        });
    }
    endWrite(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            chunk = chunk || "";
            let buffer = Buffer.from(chunk, 'base64');
            let item = this.tokenToInfo(token);
            let id = item.id;
            let metadata = {
                group: item.group,
                name: item.group,
                expire_time: item.expire_time,
                completed: item.completed,
            };
            let append = false;
            let size = yield this._storage.getChunksSize(correlationId, id);
            append = size > 0;
            if (append) {
                // If some chunks already stored in temp file - append then upload the entire file
                yield this._storage.appendChunk(correlationId, id, buffer);
                // Open and seek to define blob size
                let gs = new this._GridStore(this._connection.getDatabase(), id, "w", {
                    root: this._collectionName,
                    content_type: item.content_type,
                    metadata: metadata
                });
                yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    gs.open((err, gs) => {
                        if (err)
                            reject(err);
                        gs.writeFile(this._storage.makeFileName(id), (err) => {
                            if (err)
                                reject(err);
                            item.size = gs.position;
                            item.create_time = new Date();
                            resolve(null);
                        });
                    });
                }));
                yield this._storage.deleteChunks(correlationId, id);
            }
            if (!append) {
                // If it's the first chunk then upload it without writing to temp file
                let mongo = require('mongodb');
                this._GridStore = mongo.GridStore;
                let gs = new this._GridStore(this._connection.getDatabase(), id, "w", {
                    root: this._collectionName,
                    content_type: item.content_type,
                    metadata: metadata
                });
                // todo check this
                yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    gs.open((err, gs) => {
                        if (err != null)
                            reject(err);
                        gs.write(buffer, (err, gs) => {
                            if (err)
                                reject(err);
                            item.size = gs.position;
                            item.create_time = new Date();
                            gs.close(e => {
                                if (err)
                                    reject(err);
                                resolve(null);
                            });
                        });
                    });
                }));
            }
            return item;
        });
    }
    abortWrite(correlationId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let item = this.tokenToInfo(token);
            let id = item.id;
            yield this._storage.deleteChunks(correlationId, id);
        });
    }
    gridToInfo(gs) {
        if (gs == null)
            return null;
        let metadata = gs.metadata || {};
        return {
            id: gs.filename,
            group: metadata.group,
            name: metadata.name,
            size: gs.length,
            content_type: gs.contentType,
            create_time: pip_services3_commons_nodex_6.DateTimeConverter.toNullableDateTime(gs.uploadDate),
            expire_time: pip_services3_commons_nodex_6.DateTimeConverter.toNullableDateTime(metadata.expire_time),
            completed: pip_services3_commons_nodex_5.BooleanConverter.toBoolean(metadata.completed)
        };
    }
    beginRead(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if exist
            yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._GridStore.exist(this._connection.getDatabase(), id, this._collectionName, (err, exist) => {
                    if (err == null && exist == false) {
                        let err = new pip_services3_commons_nodex_3.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found')
                            .withDetails('blob_id', id);
                        reject(err);
                    }
                    resolve(exist);
                });
            }));
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                // Open and seek to define blob size
                let gs = new this._GridStore(this._connection.getDatabase(), id, "r", { root: this._collectionName });
                gs.open((err, gs) => {
                    if (err)
                        reject(err);
                    gs.close((err) => {
                        if (err)
                            reject(err);
                        let item = this.gridToInfo(gs);
                        resolve(item);
                    });
                });
            }));
        });
    }
    readChunk(correlationId, id, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._GridStore.read(this._connection.getDatabase(), id, take, skip, { root: this._collectionName }, (err, data) => {
                    if (err)
                        reject(err);
                    let result = Buffer.from(data).toString('base64');
                    resolve(result);
                });
            }));
        });
    }
    endRead(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    deleteById(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._GridStore.unlink(this._connection.getDatabase(), id, { root: this._collectionName }, (err, result) => {
                    if (err)
                        reject(err);
                    resolve(result);
                });
            }));
        });
    }
    deleteByIds(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._GridStore.unlink(this._connection.getDatabase(), ids, { root: this._collectionName }, (err, result) => {
                    if (err)
                        reject(err);
                    resolve(null);
                });
            }));
        });
    }
    clear(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let ids = yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._GridStore.list(this._connection.getDatabase(), this._collectionName, (err, ids) => {
                    if (err)
                        reject(err);
                    resolve(ids);
                });
            }));
            let tasks = [];
            for (let id of ids) {
                if (id != null) {
                    tasks.push(new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        this._GridStore.unlink(this._connection.getDatabase(), id, { root: this._collectionName }, (err, result) => {
                            if (err)
                                reject(err);
                            resolve(result);
                        });
                    })));
                }
            }
            yield Promise.all(tasks);
        });
    }
}
exports.BlobsMongoDbPersistence = BlobsMongoDbPersistence;
//# sourceMappingURL=BlobsMongoDbPersistence.js.map