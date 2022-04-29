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
exports.BlobsS3Persistence = void 0;
const fs = require('fs');
const querystring = require('querystring');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_4 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_5 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_6 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_7 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_8 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_9 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_10 = require("pip-services3-commons-nodex");
const pip_services3_aws_nodex_1 = require("pip-services3-aws-nodex");
const TempBlobStorage_1 = require("./TempBlobStorage");
class BlobsS3Persistence {
    constructor() {
        this._opened = false;
        this._connectTimeout = 30000;
        this._minChunkSize = 5 * 1024 * 1024;
        this._maxBlobSize = 100 * 1024;
        this._reducedRedundancy = true;
        this._maxPageSize = 100;
        this._dependencyResolver = new pip_services3_commons_nodex_4.DependencyResolver(BlobsS3Persistence._defaultConfig);
        this._connectionResolver = new pip_services3_aws_nodex_1.AwsConnectionResolver();
        this._logger = new pip_services3_components_nodex_1.CompositeLogger();
        this._counters = new pip_services3_components_nodex_2.CompositeCounters();
        this._storage = new TempBlobStorage_1.TempBlobStorage('./data/temp');
    }
    configure(config) {
        config = config.setDefaults(BlobsS3Persistence._defaultConfig);
        this._connectionResolver.configure(config);
        this._dependencyResolver.configure(config);
        this._storage.configure(config);
        this._minChunkSize = config.getAsLongWithDefault('options.min_chunk_size', this._minChunkSize);
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
        this._reducedRedundancy = config.getAsBooleanWithDefault('options.reduced_redundancy', this._reducedRedundancy);
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._dependencyResolver.setReferences(references);
    }
    isOpen() {
        return this._opened;
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isOpen()) {
                return;
            }
            this._connection = yield this._connectionResolver.resolve(correlationId);
            const aws = require('aws-sdk');
            aws.config.update({
                accessKeyId: this._connection.getAccessId(),
                secretAccessKey: this._connection.getAccessKey(),
                region: this._connection.getRegion()
            });
            aws.config.httpOptions = {
                timeout: this._connectTimeout
            };
            this._s3 = new aws.S3();
            this._bucket = this._connection.getResource();
            this._opened = true;
            this._logger.debug(correlationId, "S3 persistence connected to %s", this._connection.getArn());
            yield this._storage.open(correlationId);
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Close temp blob storage
            yield this._storage.close(correlationId);
            this._opened = false;
        });
    }
    dataToInfo(id, data) {
        if (data == null)
            return null;
        let metadata = data.Metadata;
        return {
            id: id || data.Key,
            group: this.decodeString(metadata.group),
            name: this.decodeString(metadata.name),
            size: data.ContentLength,
            content_type: data.ContentType,
            create_time: data.LastModified,
            expire_time: data.Expires,
            completed: pip_services3_commons_nodex_6.BooleanConverter.toBoolean(metadata.completed)
        };
    }
    encodeString(value) {
        if (value == null)
            return null;
        return querystring.escape(value);
    }
    decodeString(value) {
        if (value == null)
            return null;
        return querystring.unescape(value);
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
        filter = filter || new pip_services3_commons_nodex_8.FilterParams();
        let search = this.encodeString(filter.getAsNullableString('search'));
        let id = filter.getAsNullableString('id');
        let name = this.encodeString(filter.getAsNullableString('name'));
        let group = this.encodeString(filter.getAsNullableString('group'));
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
        return __awaiter(this, void 0, void 0, function* () {
            let filterCurl = this.composeFilter(filter);
            paging = paging || new pip_services3_commons_nodex_9.PagingParams();
            let skip = paging.getSkip(0);
            let take = paging.getTake(this._maxPageSize);
            let result = [];
            let token = null;
            let completed = false;
            while (completed == false && result.length < take) {
                let params = {
                    Bucket: this._bucket,
                    ContinuationToken: token,
                    MaxKeys: this._maxPageSize
                };
                let data = yield this._s3.listObjectsV2(params).promise();
                // Set token to continue
                token = data.ContinuationToken;
                completed = token == null;
                // If nothing is returned then exit
                if (data.Contents == null || data.Contents.length == 0) {
                    completed = true;
                    continue;
                }
                // Extract ids and retrieve objects
                let ids = data.Contents.map(c => c.Key);
                let items = yield this.getListByIds(correlationId, ids);
                // Filter items using provided criteria
                items = items.filter(filterCurl);
                // Continue if skipped completely
                if (items.length <= skip) {
                    skip -= items.length;
                    continue;
                }
                // Truncate by skip number
                if (skip > 0 && items.length >= skip) {
                    skip = 0;
                    items = items.splice(0, skip);
                }
                // Include items until page is over
                for (let item of items) {
                    if (take > 0) {
                        result.push(item);
                        take--;
                    }
                }
            }
            return new pip_services3_commons_nodex_10.DataPage(result, null);
        });
    }
    getListByIds(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let items = [];
            let tasks = [];
            for (let id of ids) {
                tasks.push(new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let item = yield this.getOneById(correlationId, id);
                        if (item)
                            items.push(item);
                        resolve(null);
                    }
                    catch (err) {
                        reject(err);
                    }
                })));
            }
            yield Promise.all(tasks);
            return items;
        });
    }
    getOneById(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                Bucket: this._bucket,
                Key: id
            };
            let item = yield new Promise((resolve, reject) => {
                this._s3.headObject(params, (err, data) => {
                    if (err && err.code == "NotFound")
                        err = null;
                    if (err == null && data != null) {
                        let item = this.dataToInfo(id, data);
                        resolve(item);
                    }
                    else
                        reject(err);
                });
            });
            return item;
        });
    }
    update(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            item.group = this.encodeString(item.group);
            item.name = this.encodeString(item.name);
            let filename = item.name || (item.id + '.dat');
            let params = {
                Bucket: this._bucket,
                Key: item.id,
                CopySource: this._bucket + '/' + item.id,
                ACL: 'public-read',
                ContentDisposition: 'inline; filename=' + filename,
                ContentType: item.content_type,
                StorageClass: this._reducedRedundancy ? 'REDUCED_REDUNDANCY' : 'STANDARD',
                Expires: pip_services3_commons_nodex_7.DateTimeConverter.toNullableDateTime(item.expire_time),
                Metadata: {
                    name: item.name,
                    group: item.group,
                    completed: pip_services3_commons_nodex_5.StringConverter.toString(item.completed)
                },
                MetadataDirective: "REPLACE"
            };
            item = yield this._s3.copyObject(params).promise();
            return item;
        });
    }
    markCompleted(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            for (let id of ids) {
                tasks.push(new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let item;
                    try {
                        item = yield this.getOneById(correlationId, id);
                    }
                    catch (err) {
                        reject(err);
                    }
                    if (item != null || !item.completed) {
                        item.completed = true;
                        yield this.update(correlationId, item);
                    }
                    resolve(item);
                })));
                yield Promise.all(tasks);
            }
        });
    }
    isUriSupported() {
        return true;
    }
    getUri(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                Bucket: this._bucket,
                Key: id
            };
            return yield this._s3.getSignedUrl('getObject', params).promise();
        });
    }
    beginWrite(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            item.group = this.encodeString(item.group);
            item.name = this.encodeString(item.name);
            let filename = item.name || (item.id + '.dat');
            let params = {
                Bucket: this._bucket,
                Key: item.id,
                ACL: 'public-read',
                ContentDisposition: 'inline; filename=' + filename,
                ContentType: item.content_type,
                StorageClass: this._reducedRedundancy ? 'REDUCED_REDUNDANCY' : 'STANDARD',
                Expires: pip_services3_commons_nodex_7.DateTimeConverter.toNullableDateTime(item.expire_time),
                Metadata: {
                    name: item.name,
                    group: item.group,
                    completed: pip_services3_commons_nodex_5.StringConverter.toString(item.completed)
                }
            };
            let data = yield this._s3.createMultipartUpload(params).promise();
            let token = item.id + ';' + data.UploadId;
            return token;
        });
    }
    uploadPart(correlationId, token, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokens = (token || '').split(';');
            if (tokens.length == 0) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                    .withDetails('token', token);
            }
            let params = {
                Bucket: this._bucket,
                Key: tokens[0],
                UploadId: tokens[1],
                PartNumber: tokens.length - 1,
                Body: body
            };
            let data = yield this._s3.uploadPart(params).promise();
            if (data != null)
                token = token + ';' + data.ETag;
            return token;
        });
    }
    uploadAndDeleteChunks(correlationId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokens = (token || '').split(';');
            if (tokens.length == 0) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                    .withDetails('token', token);
            }
            let id = tokens[0];
            let body = fs.createReadStream(this._storage.makeFileName(id));
            token = yield this.uploadPart(correlationId, token, body);
            yield this._storage.deleteChunks(correlationId, id);
            return token;
        });
    }
    writeChunk(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokens = (token || '').split(';');
            if (tokens.length == 0) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                    .withDetails('token', token);
            }
            let id = tokens[0];
            chunk = chunk || "";
            let buffer = Buffer.from(chunk, 'base64');
            let size = yield this._storage.appendChunk(correlationId, id, buffer);
            if (size >= this._minChunkSize)
                token = yield this.uploadAndDeleteChunks(correlationId, token);
            return token;
        });
    }
    endWrite(correlationId, token, chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokens = (token || '').split(';');
            if (tokens.length == 0) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                    .withDetails('token', token);
            }
            let id = tokens[0];
            chunk = chunk || "";
            let buffer = Buffer.from(chunk, 'base64');
            let append = false;
            let uri = null;
            // Check if temp file exist
            let size = yield this._storage.getChunksSize(correlationId, id);
            append = size > 0;
            // Upload temp file or chunks directly
            if (append) {
                // If some chunks already stored in temp file - append then upload the entire file
                yield this._storage.appendChunk(correlationId, id, buffer);
                let tok = yield this.uploadAndDeleteChunks(correlationId, token);
                token = tok || token;
            }
            else {
                // If it's the first chunk then upload it without writing to temp file
                let tok = yield this.uploadPart(correlationId, token, buffer);
                token = tok || token;
            }
            // Complete upload
            let parts = [];
            for (let index = 2; index < tokens.length; index++) {
                parts.push({
                    ETag: tokens[index],
                    PartNumber: index - 1
                });
            }
            let params = {
                Bucket: this._bucket,
                Key: id,
                UploadId: tokens[1],
                MultipartUpload: {
                    Parts: parts
                }
            };
            yield this._s3.completeMultipartUpload(params).promise();
            return yield this.getOneById(correlationId, id);
        });
    }
    abortWrite(correlationId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokens = (token || '').split(';');
            if (tokens.length == 0) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                    .withDetails('token', token);
            }
            let parts = [];
            for (let index = 2; index < tokens.length; index++) {
                parts.push({
                    PartNumber: index,
                    ETag: tokens[index]
                });
            }
            let params = {
                Bucket: this._bucket,
                Key: tokens[0],
                UploadId: tokens[1],
                MultipartUpload: {
                    Parts: parts
                }
            };
            yield this._s3.abortMultipartUpload(params).promise();
        });
    }
    beginRead(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let item = yield this.getOneById(correlationId, id);
            if (item == null) {
                throw new pip_services3_commons_nodex_2.NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found').withDetails('blob_id', id);
            }
            return item;
        });
    }
    readChunk(correlationId, id, skip, take) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                Bucket: this._bucket,
                Key: id,
                Range: 'bytes=' + skip + '-' + (skip + take - 1)
            };
            let chunk;
            let data = yield this._s3.getObject(params).promise();
            if (data != null)
                chunk = data.Body.toString('base64');
            return chunk;
        });
    }
    endRead(correlationId, id) {
        return;
    }
    deleteById(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                Bucket: this._bucket,
                Key: id
            };
            return yield this._s3.deleteObject(params).promise();
        });
    }
    deleteByIds(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                Bucket: this._bucket,
                Delete: {
                    Objects: []
                }
            };
            for (let id of ids) {
                params.Delete.Objects.push({ Key: id });
            }
            yield this._s3.deleteObjects(params).promise();
        });
    }
    clear(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                Bucket: this._bucket,
            };
            let data = yield this._s3.listObjects(params).promise();
            let delParams = {
                Bucket: this._bucket,
                Delete: {
                    Objects: []
                }
            };
            for (let c of data.Contents)
                delParams.Delete.Objects.push({ Key: c.Key });
            yield this._s3.deleteObjects(delParams).promise();
        });
    }
}
exports.BlobsS3Persistence = BlobsS3Persistence;
BlobsS3Persistence._defaultConfig = pip_services3_commons_nodex_1.ConfigParams.fromTuples("connection.protocol", "aws", "connection.region", null, "connection.account_id", null, "connection.bucket", null, "connection.arn", null, "credential.access_id", null, "credential.access_key", null, "options.reduced_redundancy", true, "options.max_blob_size", 10 * 1024, "options.connect_timeout", 30000);
//# sourceMappingURL=BlobsS3Persistence.js.map