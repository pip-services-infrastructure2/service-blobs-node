import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { DependencyResolver } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ICommandable } from 'pip-services3-commons-nodex';
import { CommandSet } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';
import { DateTimeConverter } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { IBlobsPersistence } from '../persistence/IBlobsPersistence';
import { IBlobsController } from './IBlobsController';
import { BlobsCommandSet } from './BlobsCommandSet';

export class BlobsController implements IConfigurable, IReferenceable, ICommandable, IBlobsController {
    private static _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        'dependencies.persistence', 'service-blobs:persistence:*:*:1.0',
    );

    private _dependencyResolver: DependencyResolver = new DependencyResolver(BlobsController._defaultConfig);
    private _persistence: IBlobsPersistence;
    private _commandSet: BlobsCommandSet;

    public configure(config: ConfigParams): void {
        this._dependencyResolver.configure(config);
    }

    public setReferences(references: IReferences): void {
        this._dependencyResolver.setReferences(references);
        this._persistence = this._dependencyResolver.getOneRequired<IBlobsPersistence>('persistence');
    }

    public getCommandSet(): CommandSet {
        if (this._commandSet == null)
            this._commandSet = new BlobsCommandSet(this);
        return this._commandSet;
    }

    public async getBlobsByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>> {
        return await this._persistence.getPageByFilter(correlationId, filter, paging);
    }

    public async getBlobsByIds(correlationId: string, blobIds: string[]): Promise<BlobInfoV1[]> {
        return await this._persistence.getListByIds(correlationId, blobIds);
    }

    public async getBlobById(correlationId: string, blobId: string): Promise<BlobInfoV1> {
        return await this._persistence.getOneById(correlationId, blobId);
    }

    public async getBlobUriById(correlationId: string, blobId: string): Promise<string> {
        return await this._persistence.getUri(correlationId, blobId);
    }

    private normalizeName(name: string): string {
        if (name == null) return null;

        name = name.replace('\\', '/');
        let pos = name.lastIndexOf('/');
        if (pos >= 0)
            name = name.substring(pos + 1);

        return name;
    }

	private fixBlob(blob: BlobInfoV1): BlobInfoV1 {
        if (blob == null) return null;

        blob.create_time = DateTimeConverter.toNullableDateTime(blob.create_time);
        blob.expire_time = DateTimeConverter.toNullableDateTime(blob.expire_time);
        blob.name = this.normalizeName(blob.name);

        return blob;
    }

    public async beginBlobWrite(correlationId: string, blob: BlobInfoV1): Promise<string> {
        blob.id = blob.id || IdGenerator.nextLong();
        blob = this.fixBlob(blob);
        
        return await this._persistence.beginWrite(correlationId, blob);
    }

    public async writeBlobChunk(correlationId: string, token: string, chunk: string): Promise<string> {
        chunk = chunk || "";
        return await this._persistence.writeChunk(correlationId, token, chunk);
    }

    public async endBlobWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1> {
        chunk = chunk || "";
        return await this._persistence.endWrite(correlationId, token, chunk);
    }

    public async abortBlobWrite(correlationId: string, token: string): Promise<void> {
        await this._persistence.abortWrite(correlationId, token);
    }
    
    public async beginBlobRead(correlationId: string, blobId: string): Promise<BlobInfoV1> {
        return await this._persistence.beginRead(correlationId, blobId);
    }

    public async readBlobChunk(correlationId: string, blobId: string, skip: number, take: number): Promise<string> {
        return await this._persistence.readChunk(correlationId, blobId, skip, take);
    }

    public async endBlobRead(correlationId: string, blobId: string): Promise<void> {
        await this._persistence.endRead(correlationId, blobId);
    }

    public async updateBlobInfo(correlationId: string, blob: BlobInfoV1): Promise<BlobInfoV1> {
        return await this._persistence.update(correlationId, blob);
    }

    public async markBlobsCompleted(correlationId: string, blobIds: string[]): Promise<void> {
        return await this._persistence.markCompleted(correlationId, blobIds);
    }

    public async deleteBlobById(correlationId: string, blobId: string): Promise<void> {
        await this._persistence.deleteById(correlationId, blobId);
    }

    public async deleteBlobsByIds(correlationId: string, blobIds: string[]): Promise<void> {
        await this._persistence.deleteByIds(correlationId, blobIds);
    }
}
