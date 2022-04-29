const fs = require('fs');
const querystring = require('querystring');

import { IOpenable } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';
import { CompositeCounters } from 'pip-services3-components-nodex';
import { NotFoundException } from 'pip-services3-commons-nodex';
import { BadRequestException } from 'pip-services3-commons-nodex';
import { DependencyResolver } from 'pip-services3-commons-nodex';
import { StringConverter } from 'pip-services3-commons-nodex';
import { BooleanConverter } from 'pip-services3-commons-nodex';
import { DateTimeConverter } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { AwsConnectionResolver } from 'pip-services3-aws-nodex';
import { AwsConnectionParams } from 'pip-services3-aws-nodex';

import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { IBlobsPersistence } from './IBlobsPersistence';
import { TempBlobStorage } from './TempBlobStorage';

export class BlobsS3Persistence
    implements IOpenable, IConfigurable, IReferenceable, IBlobsPersistence {

    private static readonly _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        "connection.protocol", "aws",
        "connection.region", null,
        "connection.account_id", null,
        "connection.bucket", null,
        "connection.arn", null,

        "credential.access_id", null,
        "credential.access_key", null,

        "options.reduced_redundancy", true,
        "options.max_blob_size", 10 * 1024,
        "options.connect_timeout", 30000
    );

    protected _s3: any;
    protected _opened: boolean = false;
    protected _connection: AwsConnectionParams;
    protected _bucket: string;

    protected _connectTimeout: number = 30000;
    protected _minChunkSize: number = 5 * 1024 * 1024;
    protected _maxBlobSize: number = 100 * 1024;
    protected _reducedRedundancy: boolean = true;
    protected _maxPageSize: number = 100;

    protected _dependencyResolver: DependencyResolver = new DependencyResolver(BlobsS3Persistence._defaultConfig);
    protected _connectionResolver: AwsConnectionResolver = new AwsConnectionResolver();
    protected _logger: CompositeLogger = new CompositeLogger();
    protected _counters: CompositeCounters = new CompositeCounters();
    protected _storage: TempBlobStorage = new TempBlobStorage('./data/temp');

    public configure(config: ConfigParams): void {
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

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._dependencyResolver.setReferences(references);
    }

    public isOpen(): boolean {
        return this._opened;
    }

    public async open(correlationId: string): Promise<void> {
        if (this.isOpen()) {
            return;
        }

        this._connection = await this._connectionResolver.resolve(correlationId);

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


        await this._storage.open(correlationId);
    }

    public async close(correlationId: string): Promise<void> {
        // Close temp blob storage
        await this._storage.close(correlationId);
        this._opened = false;
    }

    private dataToInfo(id: string, data: any): BlobInfoV1 {
        if (data == null) return null;

        let metadata = data.Metadata;
        return <BlobInfoV1>{
            id: id || data.Key,
            group: this.decodeString(metadata.group),
            name: this.decodeString(metadata.name),
            size: data.ContentLength,
            content_type: data.ContentType,
            create_time: data.LastModified,
            expire_time: data.Expires,
            completed: BooleanConverter.toBoolean(metadata.completed)
        };
    }

    private encodeString(value: string): string {
        if (value == null) return null;
        return querystring.escape(value);
    }

    private decodeString(value: string): string {
        if (value == null) return null;
        return querystring.unescape(value);
    }

    private matchString(value: string, search: string): boolean {
        if (value == null && search == null)
            return true;
        if (value == null || search == null)
            return false;
        return value.toLowerCase().indexOf(search) >= 0;
    }

    private matchSearch(item: BlobInfoV1, search: string): boolean {
        search = search.toLowerCase();
        if (this.matchString(item.name, search))
            return true;
        if (this.matchString(item.group, search))
            return true;
        return false;
    }

    private composeFilter(filter: FilterParams): any {
        filter = filter || new FilterParams();
        let search = this.encodeString(filter.getAsNullableString('search'));
        let id = filter.getAsNullableString('id');
        let name = this.encodeString(filter.getAsNullableString('name'));
        let group = this.encodeString(filter.getAsNullableString('group'));
        let completed = filter.getAsNullableBoolean('completed');
        let expired = filter.getAsNullableBoolean('expired');
        let fromCreateTime = filter.getAsNullableDateTime('from_create_time');
        let toCreateTime = filter.getAsNullableDateTime('to_create_time');

        let now = new Date();

        return (item: BlobInfoV1) => {
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

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>> {

        let filterCurl = this.composeFilter(filter);

        paging = paging || new PagingParams();
        let skip = paging.getSkip(0);
        let take = paging.getTake(this._maxPageSize);

        let result: BlobInfoV1[] = [];
        let token = null;
        let completed = false;

        while (completed == false && result.length < take) {
            let params = {
                Bucket: this._bucket,
                ContinuationToken: token,
                MaxKeys: this._maxPageSize
            };

            let data = await this._s3.listObjectsV2(params).promise();

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

            let items = await this.getListByIds(correlationId, ids);

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
        
        return new DataPage<BlobInfoV1>(result, null);
    }

    public async getListByIds(correlationId: string, ids: string[]): Promise<BlobInfoV1[]> {
        let items: BlobInfoV1[] = [];

        let tasks = [];

        for (let id of ids) {
            tasks.push(
                new Promise<BlobInfoV1>(async (resolve, reject) => {
                    try {
                        let item = await this.getOneById(correlationId, id);
                        if (item) items.push(item);
                        resolve(null);
                    } catch(err) {
                        reject(err);
                    }
                })
            );
        }

        await Promise.all(tasks);
        
        return items;
    }

    public async getOneById(correlationId: string, id: string): Promise<BlobInfoV1> {

        let params = {
            Bucket: this._bucket,
            Key: id
        };

        let item = await new Promise<any>((resolve, reject) => {
            this._s3.headObject(
                params,
                (err, data) => {
                    if (err && err.code == "NotFound") err = null;

                    if (err == null && data != null) {
                        let item = this.dataToInfo(id, data);
                        resolve(item);
                    } else reject(err);
                }
            );
        });
        
        return item;
    }

    public async update(correlationId: string, item: BlobInfoV1): Promise<BlobInfoV1> {

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
            Expires: DateTimeConverter.toNullableDateTime(item.expire_time),
            Metadata: {
                name: item.name,
                group: item.group,
                completed: StringConverter.toString(item.completed)
            },
            MetadataDirective: "REPLACE"
        };

        item = await this._s3.copyObject(params).promise();

        return item
    }

    public async markCompleted(correlationId: string, ids: string[]): Promise<void> {
        let tasks = [];

        for (let id of ids) {
            tasks.push(
                new Promise<any>(async (resolve, reject) => {
                    let item: BlobInfoV1;

                    try {
                        item = await this.getOneById(correlationId, id);
                    } catch(err) {
                        reject(err);
                    }
                    
                    if (item != null || !item.completed) {
                        item.completed = true;
                        await this.update(correlationId, item);
                    } 

                    resolve(item);
                })
            );

            await Promise.all(tasks);
        }
    }

    public isUriSupported(): boolean {
        return true;
    }

    public async getUri(correlationId: string, id: string): Promise<string> {
        let params = {
            Bucket: this._bucket,
            Key: id
        };

        return await this._s3.getSignedUrl('getObject', params).promise();
    }

    public async beginWrite(correlationId: string, item: BlobInfoV1): Promise<string> {

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
            Expires: DateTimeConverter.toNullableDateTime(item.expire_time),
            Metadata: {
                name: item.name,
                group: item.group,
                completed: StringConverter.toString(item.completed)
            }
        };

        let data = await this._s3.createMultipartUpload(params).promise();
        let token = item.id + ';' + data.UploadId;

        return token;
    }

    private async uploadPart(correlationId: string, token: string, body: any): Promise<string> {

        let tokens = (token || '').split(';');

        if (tokens.length == 0) {
            throw new BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                .withDetails('token', token);
        }

        let params = {
            Bucket: this._bucket,
            Key: tokens[0],
            UploadId: tokens[1],
            PartNumber: tokens.length - 1,
            Body: body
        };

        let data = await this._s3.uploadPart(params).promise();
        if (data != null)
            token = token + ';' + data.ETag;
        
        return token;
    }

    private async uploadAndDeleteChunks(correlationId: string, token: string): Promise<string> {

        let tokens = (token || '').split(';');

        if (tokens.length == 0) {
            throw new BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                .withDetails('token', token);
        }

        let id = tokens[0];
        let body = fs.createReadStream(this._storage.makeFileName(id));
        token = await this.uploadPart(correlationId, token, body);
        await this._storage.deleteChunks(correlationId, id);
        
        return token;
    }

    public async writeChunk(correlationId: string, token: string, chunk: string): Promise<string> {

        let tokens = (token || '').split(';');

        if (tokens.length == 0) {
            throw new BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                .withDetails('token', token);
        }

        let id = tokens[0];
        chunk = chunk || "";
        let buffer = Buffer.from(chunk, 'base64');
        let size = await this._storage.appendChunk(correlationId, id, buffer);

        if (size >= this._minChunkSize)
            token = await this.uploadAndDeleteChunks(correlationId, token);
        
        return token;
    }

    public async endWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1> {

        let tokens = (token || '').split(';');

        if (tokens.length == 0) {
            throw new BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
                .withDetails('token', token);
        }

        let id = tokens[0];
        chunk = chunk || "";
        let buffer = Buffer.from(chunk, 'base64');
        let append = false;
        let uri = null;

        // Check if temp file exist
        let size = await this._storage.getChunksSize(correlationId, id);
        append = size > 0;

        // Upload temp file or chunks directly
        if (append) {
            // If some chunks already stored in temp file - append then upload the entire file
            await this._storage.appendChunk(correlationId, id, buffer);
            let tok = await this.uploadAndDeleteChunks(correlationId, token);
            token = tok || token;
        } else {
            // If it's the first chunk then upload it without writing to temp file
            let tok = await this.uploadPart(correlationId, token, buffer);
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

        await this._s3.completeMultipartUpload(params).promise();

        return await this.getOneById(correlationId, id);
    }

    public async abortWrite(correlationId: string, token: string): Promise<void> {

        let tokens = (token || '').split(';');

        if (tokens.length == 0) {
            throw new BadRequestException(correlationId, 'BAD_TOKEN', 'Token ' + token + ' is invalid')
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

        await this._s3.abortMultipartUpload(params).promise();
    }

    public async beginRead(correlationId: string, id: string): Promise<BlobInfoV1> {

        let item = await this.getOneById(correlationId, id);
        if (item == null) {
            throw new NotFoundException(
                correlationId,
                'BLOB_NOT_FOUND',
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id);
        }

        return item;
    }

    public async readChunk(correlationId: string, id: string, skip: number, take: number): Promise<string> {
        let params = {
            Bucket: this._bucket,
            Key: id,
            Range: 'bytes=' + skip + '-' + (skip + take - 1)
        };

        let chunk: string;

        let data = await this._s3.getObject(params).promise();

        if (data != null)
            chunk = data.Body.toString('base64');

        return chunk;
    }

    public endRead(correlationId: string, id: string): Promise<void> {
        return;
    }

    public async deleteById(correlationId: string, id: string): Promise<BlobInfoV1> {
        let params = {
            Bucket: this._bucket,
            Key: id
        };

        return await this._s3.deleteObject(params).promise();
    }

    public async deleteByIds(correlationId: string, ids: string[]): Promise<void> {
        let params = {
            Bucket: this._bucket,
            Delete: {
                Objects: []
            }
        };

        for (let id of ids) {
            params.Delete.Objects.push({ Key: id });
        }

        await this._s3.deleteObjects(params).promise();
    }

    public async clear(correlationId: string): Promise<void> {
        let params = {
            Bucket: this._bucket,
        };

        let data = await this._s3.listObjects(params).promise();

        let delParams = {
            Bucket: this._bucket,
            Delete: {
                Objects: []
            }
        };

        for (let c of data.Contents)
            delParams.Delete.Objects.push({ Key: c.Key })

        await this._s3.deleteObjects(delParams).promise();
    }
}