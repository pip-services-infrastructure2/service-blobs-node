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
exports.BlobsCommandSet = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_4 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_5 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_6 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_7 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_8 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_9 = require("pip-services3-commons-nodex");
const BlobInfoV1Schema_1 = require("../data/version1/BlobInfoV1Schema");
class BlobsCommandSet extends pip_services3_commons_nodex_1.CommandSet {
    constructor(logic) {
        super();
        this._logic = logic;
        this.addCommand(this.makeGetBlobsByFilterCommand());
        this.addCommand(this.makeGetBlobsByIdsCommand());
        this.addCommand(this.makeGetBlobByIdCommand());
        this.addCommand(this.makeGetBlobUriByIdCommand());
        this.addCommand(this.makeBeginBlobWriteCommand());
        this.addCommand(this.makeWriteBlobChunkCommand());
        this.addCommand(this.makeEndBlobWriteCommand());
        this.addCommand(this.makeAbortBlobWriteCommand());
        this.addCommand(this.makeBeginBlobReadCommand());
        this.addCommand(this.makeReadBlobChunkCommand());
        this.addCommand(this.makeEndBlobReadCommand());
        this.addCommand(this.makeUpdateBlobInfoCommand());
        this.addCommand(this.makeMarkBlobsCompletedCommand());
        this.addCommand(this.makeDeleteBlobByIdCommand());
        this.addCommand(this.makeDeleteBlobsByIdsCommand());
    }
    makeGetBlobsByFilterCommand() {
        return new pip_services3_commons_nodex_2.Command("get_blobs_by_filter", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withOptionalProperty("filter", new pip_services3_commons_nodex_8.FilterParamsSchema())
            .withOptionalProperty("paging", new pip_services3_commons_nodex_9.PagingParamsSchema()), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let filter = pip_services3_commons_nodex_3.FilterParams.fromValue(args.get("filter"));
            let paging = pip_services3_commons_nodex_4.PagingParams.fromValue(args.get("paging"));
            return yield this._logic.getBlobsByFilter(correlationId, filter, paging);
        }));
    }
    makeGetBlobsByIdsCommand() {
        return new pip_services3_commons_nodex_2.Command("get_blobs_by_ids", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_ids", new pip_services3_commons_nodex_6.ArraySchema(pip_services3_commons_nodex_7.TypeCode.String)), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let temp = args.getAsString("blob_ids");
            let blobIds = temp.split(',');
            return yield this._logic.getBlobsByIds(correlationId, blobIds);
        }));
    }
    makeGetBlobByIdCommand() {
        return new pip_services3_commons_nodex_2.Command("get_blob_by_id", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_id", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobId = args.getAsNullableString("blob_id");
            return yield this._logic.getBlobById(correlationId, blobId);
        }));
    }
    makeGetBlobUriByIdCommand() {
        return new pip_services3_commons_nodex_2.Command("get_blob_uri_by_id", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_id", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobId = args.getAsNullableString("blob_id");
            return yield this._logic.getBlobUriById(correlationId, blobId);
        }));
    }
    makeBeginBlobWriteCommand() {
        return new pip_services3_commons_nodex_2.Command("begin_blob_write", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob", new BlobInfoV1Schema_1.BlobInfoV1Schema()), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blob = args.get("blob");
            return yield this._logic.beginBlobWrite(correlationId, blob);
        }));
    }
    makeWriteBlobChunkCommand() {
        return new pip_services3_commons_nodex_2.Command("write_blob_chunk", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("token", pip_services3_commons_nodex_7.TypeCode.String)
            .withRequiredProperty("chunk", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let token = args.getAsNullableString("token");
            let chunk = args.getAsNullableString("chunk");
            return yield this._logic.writeBlobChunk(correlationId, token, chunk);
        }));
    }
    makeEndBlobWriteCommand() {
        return new pip_services3_commons_nodex_2.Command("end_blob_write", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("token", pip_services3_commons_nodex_7.TypeCode.String)
            .withOptionalProperty("chunk", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let token = args.getAsNullableString("token");
            let chunk = args.getAsNullableString("chunk");
            return yield this._logic.endBlobWrite(correlationId, token, chunk);
        }));
    }
    makeAbortBlobWriteCommand() {
        return new pip_services3_commons_nodex_2.Command("abort_blob_write", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("token", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let token = args.getAsNullableString("token");
            return yield this._logic.abortBlobWrite(correlationId, token);
        }));
    }
    makeBeginBlobReadCommand() {
        return new pip_services3_commons_nodex_2.Command("begin_blob_read", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_id", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobId = args.getAsNullableString("blob_id");
            return yield this._logic.beginBlobRead(correlationId, blobId);
        }));
    }
    makeReadBlobChunkCommand() {
        return new pip_services3_commons_nodex_2.Command("read_blob_chunk", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_id", pip_services3_commons_nodex_7.TypeCode.String)
            .withRequiredProperty("skip", pip_services3_commons_nodex_7.TypeCode.Long)
            .withRequiredProperty("take", pip_services3_commons_nodex_7.TypeCode.Long), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobId = args.getAsNullableString("blob_id");
            let skip = args.getAsNullableLong("skip");
            let take = args.getAsNullableLong("take");
            return yield this._logic.readBlobChunk(correlationId, blobId, skip, take);
        }));
    }
    makeEndBlobReadCommand() {
        return new pip_services3_commons_nodex_2.Command("end_blob_read", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_id", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobId = args.getAsNullableString("blob_id");
            return yield this._logic.endBlobRead(correlationId, blobId);
        }));
    }
    makeUpdateBlobInfoCommand() {
        return new pip_services3_commons_nodex_2.Command("update_blob_info", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob", new BlobInfoV1Schema_1.BlobInfoV1Schema()), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blob = args.get("blob");
            return yield this._logic.updateBlobInfo(correlationId, blob);
        }));
    }
    makeMarkBlobsCompletedCommand() {
        return new pip_services3_commons_nodex_2.Command("mark_blobs_completed", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_ids", new pip_services3_commons_nodex_6.ArraySchema(pip_services3_commons_nodex_7.TypeCode.String)), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobIds = args.get("blob_ids");
            return yield this._logic.markBlobsCompleted(correlationId, blobIds);
        }));
    }
    makeDeleteBlobByIdCommand() {
        return new pip_services3_commons_nodex_2.Command("delete_blob_by_id", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_id", pip_services3_commons_nodex_7.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobId = args.getAsNullableString("blob_id");
            return yield this._logic.deleteBlobById(correlationId, blobId);
        }));
    }
    makeDeleteBlobsByIdsCommand() {
        return new pip_services3_commons_nodex_2.Command("delete_blobs_by_ids", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty("blob_ids", new pip_services3_commons_nodex_6.ArraySchema(pip_services3_commons_nodex_7.TypeCode.String)), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let blobIds = args.get("blob_ids");
            return yield this._logic.deleteBlobsByIds(correlationId, blobIds);
        }));
    }
}
exports.BlobsCommandSet = BlobsCommandSet;
//# sourceMappingURL=BlobsCommandSet.js.map