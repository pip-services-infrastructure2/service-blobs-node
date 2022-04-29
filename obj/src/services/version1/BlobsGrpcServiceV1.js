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
exports.BlobsGrpcServiceV1 = void 0;
const services = require('../../../../src/protos/blobs_v1_grpc_pb');
const messages = require('../../../../src/protos/blobs_v1_pb');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_grpc_nodex_1 = require("pip-services3-grpc-nodex");
const BlobsGrpcConverterV1_1 = require("./BlobsGrpcConverterV1");
class BlobsGrpcServiceV1 extends pip_services3_grpc_nodex_1.GrpcService {
    constructor() {
        super(services.BlobsService);
        this._dependencyResolver.put('controller', new pip_services3_commons_nodex_1.Descriptor("service-blobs", "controller", "default", "*", "*"));
    }
    setReferences(references) {
        super.setReferences(references);
        this._controller = this._dependencyResolver.getOneRequired('controller');
    }
    getBlobsByFilter(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let filter = new pip_services3_commons_nodex_2.FilterParams();
            BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.setMap(filter, call.request.getFilterMap());
            let paging = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.toPagingParams(call.request.getPaging());
            let response = new messages.BlobInfoPageReply();
            try {
                let result = yield this._controller.getBlobsByFilter(correlationId, filter, paging);
                let page = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromBlobInfoPage(result);
                response.setPage(page);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    getBlobsByIds(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobIds = call.request.getBlobIdsList();
            let response = new messages.BlobInfoObjectsReply();
            try {
                let result = yield this._controller.getBlobsByIds(correlationId, blobIds);
                let page = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromBlobInfos(result);
                response.setBlobsList(page);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    getBlobById(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobId = call.request.getBlobId();
            let response = new messages.BlobInfoObjectReply();
            try {
                let result = yield this._controller.getBlobById(correlationId, blobId);
                let blob = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromBlobInfo(result);
                response.setBlob(blob);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    getBlobUriById(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobId = call.request.getBlobId();
            let response = new messages.BlobUriReply();
            try {
                let result = yield this._controller.getBlobUriById(correlationId, blobId);
                response.setUri(result);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    beginBlobWrite(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blob = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.toBlobInfo(call.request.getBlob());
            let response = new messages.BlobTokenReply();
            try {
                let result = yield this._controller.beginBlobWrite(correlationId, blob);
                response.setToken(result);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    writeBlobChunk(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let token = call.request.getToken();
            let chunk = call.request.getChunk();
            let response = new messages.BlobTokenReply();
            try {
                let result = yield this._controller.writeBlobChunk(correlationId, token, chunk);
                response.setToken(result);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    endBlobWrite(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let token = call.request.getToken();
            let chunk = call.request.getChunk();
            let response = new messages.BlobInfoObjectReply();
            try {
                let result = yield this._controller.endBlobWrite(correlationId, token, chunk);
                let blob = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromBlobInfo(result);
                response.setBlob(blob);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    abortBlobWrite(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let token = call.request.getToken();
            let response = new messages.BlobEmptyReply();
            try {
                yield this._controller.abortBlobWrite(correlationId, token);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    beginBlobRead(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobId = call.request.getBlobId();
            let response = new messages.BlobInfoObjectReply();
            try {
                let result = yield this._controller.beginBlobRead(correlationId, blobId);
                let blob = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromBlobInfo(result);
                response.setBlob(blob);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    readBlobChunk(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobId = call.request.getBlobId();
            let skip = call.request.getSkip();
            let take = call.request.getTake();
            let response = new messages.BlobChunkReply();
            try {
                let result = yield this._controller.readBlobChunk(correlationId, blobId, skip, take);
                response.setChunk(result);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    endBlobRead(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobId = call.request.getBlobId();
            let response = new messages.BlobEmptyReply();
            try {
                yield this._controller.endBlobRead(correlationId, blobId);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    updateBlobInfo(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blob = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.toBlobInfo(call.request.getBlob());
            let response = new messages.BlobObjectReply();
            try {
                let result = yield this._controller.updateBlobInfo(correlationId, blob);
                let grpcBlob = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromBlobInfo(result);
                if (result)
                    response.setBlob(grpcBlob);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    markBlobsCompleted(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobIds = call.request.getBlobIdsList();
            let response = new messages.BlobEmptyReply();
            try {
                yield this._controller.markBlobsCompleted(correlationId, blobIds);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    deleteBlobById(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobId = call.request.getBlobId();
            let response = new messages.BlobEmptyReply();
            try {
                yield this._controller.deleteBlobById(correlationId, blobId);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    deleteBlobsByIds(call) {
        return __awaiter(this, void 0, void 0, function* () {
            let correlationId = call.request.getCorrelationId();
            let blobIds = call.request.getBlobIdsList();
            let response = new messages.BlobEmptyReply();
            try {
                yield this._controller.deleteBlobsByIds(correlationId, blobIds);
            }
            catch (err) {
                let error = BlobsGrpcConverterV1_1.BlobsGrpcConverterV1.fromError(err);
                response.setError(error);
            }
            return response;
        });
    }
    register() {
        this.registerMethod('get_blobs_by_filter', null, this.getBlobsByFilter);
        this.registerMethod('get_blobs_by_ids', null, this.getBlobsByIds);
        this.registerMethod('get_blob_by_id', null, this.getBlobById);
        this.registerMethod('get_blob_uri_by_id', null, this.getBlobUriById);
        this.registerMethod('begin_blob_write', null, this.beginBlobWrite);
        this.registerMethod('write_blob_chunk', null, this.writeBlobChunk);
        this.registerMethod('end_blob_write', null, this.endBlobWrite);
        this.registerMethod('abort_blob_write', null, this.abortBlobWrite);
        this.registerMethod('begin_blob_read', null, this.beginBlobRead);
        this.registerMethod('read_blob_chunk', null, this.readBlobChunk);
        this.registerMethod('end_blob_read', null, this.endBlobRead);
        this.registerMethod('update_blob_info', null, this.updateBlobInfo);
        this.registerMethod('mark_blobs_completed', null, this.markBlobsCompleted);
        this.registerMethod('delete_blob_by_id', null, this.deleteBlobById);
        this.registerMethod('delete_blobs_by_ids', null, this.deleteBlobsByIds);
    }
}
exports.BlobsGrpcServiceV1 = BlobsGrpcServiceV1;
//# sourceMappingURL=BlobsGrpcServiceV1.js.map