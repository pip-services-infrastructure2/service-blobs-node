import { ConfigParams } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { AnyValueMap } from 'pip-services3-commons-nodex';
import { NotFoundException } from 'pip-services3-commons-nodex';
import { BadRequestException } from 'pip-services3-commons-nodex';
import { IdentifiableMemoryPersistence } from 'pip-services3-data-nodex';

import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { IBlobsPersistence } from './IBlobsPersistence';

export class BlobsMemoryPersistence 
    extends IdentifiableMemoryPersistence<BlobInfoV1, string> 
    implements IBlobsPersistence {

    protected _content: { [index: string]: Buffer } = {};
    protected _maxBlobSize: number = 100 * 1024;

    constructor() {
        super();
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        this._maxBlobSize = config.getAsLongWithDefault('options.max_blob_size', this._maxBlobSize);
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
        let search = filter.getAsNullableString('search');
        let id = filter.getAsNullableString('id');
        let name = filter.getAsNullableString('name');
        let group = filter.getAsNullableString('group');
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
        return await super.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null);
    }

    public async markCompleted(correlationId: string, ids: string[]): Promise<void> {
        let tasks = [];

        for (let id of ids) {
            tasks.push(
                super.updatePartially(correlationId, id, AnyValueMap.fromTuples('completed', true))
            );
        }

        await Promise.all(tasks);
    }

    public async deleteById(correlationId: string, id: string): Promise<BlobInfoV1> {
        delete this._content[id];
        return await super.deleteById(correlationId, id);
    }

    public async deleteByIds(correlationId: string, ids: string[]): Promise<void> {
        for(let id of ids)
            delete this._content[id];
       
        await super.deleteByIds(correlationId, ids);
    }

    public async clear(correlationId: string): Promise<void> {
        this._content = {};
        await super.clear(correlationId);
    }


    public isUriSupported(): boolean {
        return false;
    }

    public async getUri(correlationId: string, id: string): Promise<string> {
        return null;
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

        item = await super.create(correlationId, item);
        let buffer = new Buffer([])
        this._content[item.id] = buffer;
        return item.id;
    }

    public async writeChunk(correlationId: string, token: string, chunk: string): Promise<string> {
        
        let id = token;
        let oldBuffer = this._content[id];
        if (oldBuffer == null) {
            throw new NotFoundException(
                correlationId, 
                'BLOB_NOT_FOUND', 
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id);
        }

        // Enforce maximum size
        let chunkLength = chunk ? chunk.length : 0;
        if (this._maxBlobSize > 0 && oldBuffer.length + chunkLength > this._maxBlobSize) {
            throw new BadRequestException(
                correlationId,
                'BLOB_TOO_LARGE',
                'Blob ' + id + ' exceeds allowed maximum size of ' + this._maxBlobSize
            ).withDetails('blob_id', id)
            .withDetails('size', oldBuffer.length + chunkLength)
            .withDetails('max_size', this._maxBlobSize);
        }

        let buffer = new Buffer("", "base64");
        if (chunk != null && chunk.length > 0) 
            buffer = Buffer.from(chunk, 'base64');
        this._content[id] = Buffer.concat([oldBuffer, buffer]);

        return token;
    }

    public async endWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1> {

        let id = token;
        let item: BlobInfoV1;

        // Write last chunk of the blob
        await this.writeChunk(correlationId, token, chunk);

        // Get blob info
        item = await super.getOneById(correlationId, id);
        if (item == null) {
            throw new NotFoundException(
                correlationId,
                'BLOB_NOT_FOUND',
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id);
        }

        // Update blob info with size and create time
        let buffer = this._content[id];
        item.create_time = new Date();
        item.size = buffer != null ? buffer.length : 0;

       return await super.update(correlationId, item);
    }

    public async abortWrite(correlationId: string, token: string): Promise<void> {
        let id = token;
        await this.deleteById(correlationId, id);
    }

    public async beginRead(correlationId: string, id: string): Promise<BlobInfoV1> {
        let oldBuffer = this._content[id];
        if (oldBuffer == null) {
            throw new NotFoundException(
                correlationId, 
                'BLOB_NOT_FOUND', 
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id);
        }

        return await super.getOneById(correlationId, id);
    }

    public async readChunk(correlationId: string, id: string, skip: number, take: number): Promise<string> {

        let oldBuffer = this._content[id];
        if (oldBuffer == null) {
            throw new NotFoundException(
                correlationId, 
                'BLOB_NOT_FOUND', 
                'Blob ' + id + ' was not found'
            ).withDetails('blob_id', id);
        }

        let result = oldBuffer.toString('base64', skip, skip + take);
        return result;
    }

    public async endRead(correlationId: string, id: string): Promise<void> {
        return;
    }

}
