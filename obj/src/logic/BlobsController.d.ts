import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ICommandable } from 'pip-services3-commons-nodex';
import { CommandSet } from 'pip-services3-commons-nodex';
import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { IBlobsController } from './IBlobsController';
export declare class BlobsController implements IConfigurable, IReferenceable, ICommandable, IBlobsController {
    private static _defaultConfig;
    private _dependencyResolver;
    private _persistence;
    private _commandSet;
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    getCommandSet(): CommandSet;
    getBlobsByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>>;
    getBlobsByIds(correlationId: string, blobIds: string[]): Promise<BlobInfoV1[]>;
    getBlobById(correlationId: string, blobId: string): Promise<BlobInfoV1>;
    getBlobUriById(correlationId: string, blobId: string): Promise<string>;
    private normalizeName;
    private fixBlob;
    beginBlobWrite(correlationId: string, blob: BlobInfoV1): Promise<string>;
    writeBlobChunk(correlationId: string, token: string, chunk: string): Promise<string>;
    endBlobWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1>;
    abortBlobWrite(correlationId: string, token: string): Promise<void>;
    beginBlobRead(correlationId: string, blobId: string): Promise<BlobInfoV1>;
    readBlobChunk(correlationId: string, blobId: string, skip: number, take: number): Promise<string>;
    endBlobRead(correlationId: string, blobId: string): Promise<void>;
    updateBlobInfo(correlationId: string, blob: BlobInfoV1): Promise<BlobInfoV1>;
    markBlobsCompleted(correlationId: string, blobIds: string[]): Promise<void>;
    deleteBlobById(correlationId: string, blobId: string): Promise<void>;
    deleteBlobsByIds(correlationId: string, blobIds: string[]): Promise<void>;
}