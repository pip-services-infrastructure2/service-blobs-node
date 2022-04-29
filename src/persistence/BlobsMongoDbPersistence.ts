import { ConfigParams } from 'pip-services3-commons-nodex';
import { BadRequestException } from 'pip-services3-commons-nodex';
import { NotFoundException } from 'pip-services3-commons-nodex';
import { MongoDbPersistence } from 'pip-services3-mongodb-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';
import { BooleanConverter } from 'pip-services3-commons-nodex';
import { DateTimeConverter } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { IBlobsPersistence } from './IBlobsPersistence';
import { TempBlobStorage } from './TempBlobStorage';

export class BlobsMongoDbPersistence extends MongoDbPersistence<BlobInfoV1> implements IBlobsPersistence {
    protected _GridStore: any;
    protected _storage: TempBlobStorage = new TempBlobStorage('./data/temp');
    protected _maxBlobSize: number = 100 * 1024;
    protected _maxPageSize: number = 100;

    public constructor() {
        super('blobs');
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        this._storage.configure(config);

        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
    }

    public async open(correlationId: string): Promise<void> {
        await super.open(correlationId);

        // Open temp blob storage
        await this._storage.open(correlationId);

        let mongo = require('mongodb');
        this._GridStore = mongo.GridStore;
    }

    public async close(correlationId: string): Promise<void> {
        // Close temp blob storage
        await this._storage.close(correlationId);
        this._GridStore = null;
        await super.close(correlationId);
    }


    private composeFilter(filter: FilterParams): any {
        filter = filter || new FilterParams();

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

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>> {
        let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
        let criteria = this.composeFilter(filter);

        // Adjust max item count based on configuration
        paging = paging || new PagingParams();
        let skip = paging.getSkip(-1);
        let take = paging.getTake(this._maxPageSize);
        let pagingEnabled = paging.total;

        // Configure options
        let options: any = {};

        if (skip >= 0) options.skip = skip;
        options.limit = take;

        let items = await new Promise<any[]>((resolve, reject) => {
            collection.find(criteria, options).toArray((err, items) => {
                if (err == null) resolve(items);
                else reject(err);
            });
        });

        if (items != null) {
            this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._collectionName);
        }

        items = items || [];
        items = items.map(this.convertToPublic);

        let count: number = null;
        if (pagingEnabled) {
            count = await new Promise<number>((resolve, reject) => {
                collection.countDocuments(filter, (err, count) => {
                    if (err == null) resolve(count);
                    else reject(err);
                });
            });
        }

        items = items.map((item) => {
            return this.gridToInfo(item);
        });

        return new DataPage<BlobInfoV1>(items, count);
    }

    public async getListByIds(correlationId: string, ids: string[]): Promise<BlobInfoV1[]> {
        let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
        let criteria = {
            filename: { $in: ids }
        };

        // Configure options
        let options: any = {};

        let items = await new Promise<any[]>((resolve, reject) => {
            collection.find(criteria, options).toArray((err, items) => {
                if (err == null) resolve(items);
                else reject(err);
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
    }

    public async getOneById(correlationId: string, id: string): Promise<BlobInfoV1> {

        let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
        let criteria = {
            filename: id
        };

        let item = await new Promise<any>((resolve, reject) => {
            collection.findOne(criteria, (err, item) => {
                if (err == null) resolve(item);
                else reject(err);
            });
        });

        if (item == null) {
            this._logger.trace(correlationId, "Nothing found from %s with id = %s", this._collectionName, id);
        } else {
            this._logger.trace(correlationId, "Retrieved from %s with id = %s", this._collectionName, id);
        }

        item = this.gridToInfo(item);
        return item;
    }

    public async update(correlationId: string, item: BlobInfoV1): Promise<BlobInfoV1> {

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
        }
        let options = {
            new: true
        };

        let res = await new Promise<any>((resolve, reject) => {
            collection.findAndModify(criteria, [], doc, options, (err, item) => {
                if (err != null) reject(err);
                if (item == null || item.value == null) resolve(null);
                resolve(item);
            });
        });

        item = this.gridToInfo(res.value);

        return item
    }

    public async markCompleted(correlationId: string, ids: string[]): Promise<void> {
        let collection = this._connection.getDatabase().collection(this._collectionName + '.files');
        let criteria = {
            filename: { $in: ids }
        };
        let doc = {
            $set: {
                'metadata.completed': true
            }
        }
        let options = {
            multi: true
        };

        await new Promise<any>((resolve, reject) => {
            collection.update(criteria, doc, options, (err) => {
                if(err) reject(err);
                resolve(null);
            });
        });
    }

    public isUriSupported(): boolean {
        return false;
    }

    public getUri(correlationId: string, id: string): Promise<string> {
        return null;
    }

    private infoToToken(item: BlobInfoV1): string {
        let data = ConfigParams.fromValue(item);
        return data.toString();
    }

    private tokenToInfo(token: string): BlobInfoV1 {
        let data = ConfigParams.fromString(token);
        return <BlobInfoV1>{
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

    public async beginWrite(correlationId: string, item: BlobInfoV1): Promise<string> {
        if (item.size != null && item.size > this._maxBlobSize) {
            throw new BadRequestException(
                correlationId,
                'BLOB_TOO_LARGE',
                'Blob ' + item.id + ' exceeds allowed maximum size of ' + this._maxBlobSize
            ).withDetails('blob_id', item.id)
            .withDetails('size', item.size)
            .withDetails('max_size', this._maxBlobSize);
        }

        item.id = item.id || IdGenerator.nextLong();
        let token = this.infoToToken(item);

        return token;
    }

    public async writeChunk(correlationId: string, token: string, chunk: string): Promise<string> {

        let item = this.tokenToInfo(token);
        chunk = chunk || "";
        let buffer = Buffer.from(chunk, 'base64');
        await this._storage.appendChunk(correlationId, item.id, buffer);

        return token;
    }

    public async endWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1> {

        chunk = chunk || "";
        let buffer = Buffer.from(chunk, 'base64');
        let item = this.tokenToInfo(token);
        let id = item.id;
        let metadata = {
            group: item.group,
            name: item.group,
            expire_time: item.expire_time,
            completed: item.completed,
        } 
        let append = false;

        let size = await this._storage.getChunksSize(correlationId, id);
        append = size > 0;

        if (append) {
            // If some chunks already stored in temp file - append then upload the entire file
            await this._storage.appendChunk(correlationId, id, buffer);

            // Open and seek to define blob size
            let gs = new this._GridStore(
                this._connection.getDatabase(), id, "w",
                {
                    root: this._collectionName,
                    content_type: item.content_type,
                    metadata: metadata
                }
            );

            await new Promise<any>(async (resolve, reject) => {
                gs.open((err, gs) => {
                    if (err) reject(err);

                    gs.writeFile(this._storage.makeFileName(id), (err) => {
                        if (err) reject(err);
                        item.size = gs.position;
                        item.create_time = new Date();
                        resolve(null);
                    });
                });
            });

            await this._storage.deleteChunks(correlationId, id);
        }

        if (!append) {
            // If it's the first chunk then upload it without writing to temp file
            let mongo = require('mongodb');
            this._GridStore = mongo.GridStore;

            let gs = new this._GridStore(
                this._connection.getDatabase(), id, "w",
                {
                    root: this._collectionName,
                    content_type: item.content_type,
                    metadata: metadata
                }
            );

            // todo check this
            await new Promise<any>(async (resolve, reject) => {
                gs.open((err, gs) => {
                    if (err != null) reject(err);

                    gs.write(buffer, (err, gs) => {
                        if (err) reject(err)

                        item.size = gs.position;
                        item.create_time = new Date();
                        gs.close(e => {
                            if (err) reject(err)
                            resolve(null);
                        });
                    });
                });    
            });
        }

        return item;
    }
    
    public async abortWrite(correlationId: string, token: string): Promise<void> {
        let item = this.tokenToInfo(token);
        let id = item.id;
        await this._storage.deleteChunks(correlationId, id);
    }

    private gridToInfo(gs: any): BlobInfoV1 {
        if (gs == null) return null;

        let metadata = gs.metadata || {};
        return <BlobInfoV1>{
            id: gs.filename,
            group: metadata.group,
            name: metadata.name,
            size: gs.length,
            content_type: gs.contentType,
            create_time: DateTimeConverter.toNullableDateTime(gs.uploadDate),
            expire_time: DateTimeConverter.toNullableDateTime(metadata.expire_time),
            completed: BooleanConverter.toBoolean(metadata.completed)
        };
    }

    public async beginRead(correlationId: string, id: string): Promise<BlobInfoV1> {

        // Check if exist
        await new Promise<any>(async (resolve, reject) => {
            this._GridStore.exist(this._connection.getDatabase(), id, this._collectionName, (err, exist) => {
                if (err == null && exist == false) {
                    let err = new NotFoundException(correlationId, 'BLOB_NOT_FOUND', 'Blob ' + id + ' was not found')
                        .withDetails('blob_id', id);
                    reject(err);
                }

                resolve(exist);
            });
        });

        return await new Promise<any>(async (resolve, reject) => {
            // Open and seek to define blob size
            let gs = new this._GridStore(this._connection.getDatabase(), id, "r", { root: this._collectionName });

            gs.open((err, gs) => {
                if (err) reject(err);

                gs.close((err) => {
                    if (err) reject(err);
                    let item = this.gridToInfo(gs);
                    resolve(item);
                });
            });
        });
    }

    public async readChunk(correlationId: string, id: string, skip: number, take: number): Promise<string> {
        return await new Promise<any>(async (resolve, reject) => {
            this._GridStore.read(this._connection.getDatabase(), id, take, skip, { root: this._collectionName }, (err, data) => {
                if (err) reject(err);

                let result = Buffer.from(data).toString('base64');
                resolve(result);
            });
        });
    }

    public async endRead(correlationId: string, id: string): Promise<void> {
        return null;
    }

    public async deleteById(correlationId: string, id: string): Promise<BlobInfoV1> {
        return await new Promise<any>(async (resolve, reject) => {
            this._GridStore.unlink(this._connection.getDatabase(), id, { root: this._collectionName }, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
        
    }

    public async deleteByIds(correlationId: string, ids: string[]): Promise<void> {
        await new Promise<any>(async (resolve, reject) => {
            this._GridStore.unlink(this._connection.getDatabase(), ids, { root: this._collectionName }, (err, result) => {
                if (err) reject(err);
                resolve(null);
            });
        });
    }

    public async clear(correlationId: string): Promise<void> {
        let ids = await new Promise<any>(async (resolve, reject) => {
            this._GridStore.list(this._connection.getDatabase(), this._collectionName, (err, ids) => {
                if (err) reject(err);
                resolve(ids)
            });
        });

        let tasks = [];

        for (let id of ids) {
            if (id != null) {
                tasks.push(
                    new Promise<any>(async (resolve, reject) => {
                        this._GridStore.unlink(this._connection.getDatabase(), id, { root: this._collectionName }, (err, result) => {
                            if (err) reject(err);
                            resolve(result);
                        })
                    })
                );
            }
        }

        await Promise.all(tasks);
    }

}
