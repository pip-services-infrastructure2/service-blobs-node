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
exports.BlobsController = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_4 = require("pip-services3-commons-nodex");
const BlobsCommandSet_1 = require("./BlobsCommandSet");
class BlobsController {
    constructor() {
        this._dependencyResolver = new pip_services3_commons_nodex_2.DependencyResolver(BlobsController._defaultConfig);
    }
    configure(config) {
        this._dependencyResolver.configure(config);
    }
    setReferences(references) {
        this._dependencyResolver.setReferences(references);
        this._persistence = this._dependencyResolver.getOneRequired('persistence');
    }
    getCommandSet() {
        if (this._commandSet == null)
            this._commandSet = new BlobsCommandSet_1.BlobsCommandSet(this);
        return this._commandSet;
    }
    getBlobsByFilter(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.getPageByFilter(correlationId, filter, paging);
        });
    }
    getBlobsByIds(correlationId, blobIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.getListByIds(correlationId, blobIds);
        });
    }
    getBlobById(correlationId, blobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.getOneById(correlationId, blobId);
        });
    }
    getBlobUriById(correlationId, blobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.getUri(correlationId, blobId);
        });
    }
    normalizeName(name) {
        if (name == null)
            return null;
        name = name.replace('\\', '/');
        let pos = name.lastIndexOf('/');
        if (pos >= 0)
            name = name.substring(pos + 1);
        return name;
    }
    fixBlob(blob) {
        if (blob == null)
            return null;
        blob.create_time = pip_services3_commons_nodex_4.DateTimeConverter.toNullableDateTime(blob.create_time);
        blob.expire_time = pip_services3_commons_nodex_4.DateTimeConverter.toNullableDateTime(blob.expire_time);
        blob.name = this.normalizeName(blob.name);
        return blob;
    }
    beginBlobWrite(correlationId, blob) {
        return __awaiter(this, void 0, void 0, function* () {
            blob.id = blob.id || pip_services3_commons_nodex_3.IdGenerator.nextLong();
            blob = this.fixBlob(blob);
            return yield this._persistence.beginWrite(correlationId, blob);
        });
    }
    writeBlobChunk(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            chunk = chunk || "";
            return yield this._persistence.writeChunk(correlationId, token, chunk);
        });
    }
    endBlobWrite(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            chunk = chunk || "";
            return yield this._persistence.endWrite(correlationId, token, chunk);
        });
    }
    abortBlobWrite(correlationId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._persistence.abortWrite(correlationId, token);
        });
    }
    beginBlobRead(correlationId, blobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.beginRead(correlationId, blobId);
        });
    }
    readBlobChunk(correlationId, blobId, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.readChunk(correlationId, blobId, skip, take);
        });
    }
    endBlobRead(correlationId, blobId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._persistence.endRead(correlationId, blobId);
        });
    }
    updateBlobInfo(correlationId, blob) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.update(correlationId, blob);
        });
    }
    markBlobsCompleted(correlationId, blobIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.markCompleted(correlationId, blobIds);
        });
    }
    deleteBlobById(correlationId, blobId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._persistence.deleteById(correlationId, blobId);
        });
    }
    deleteBlobsByIds(correlationId, blobIds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._persistence.deleteByIds(correlationId, blobIds);
        });
    }
}
exports.BlobsController = BlobsController;
BlobsController._defaultConfig = pip_services3_commons_nodex_1.ConfigParams.fromTuples('dependencies.persistence', 'service-blobs:persistence:*:*:1.0');
//# sourceMappingURL=BlobsController.js.map