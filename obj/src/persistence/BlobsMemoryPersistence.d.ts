/// <reference types="node" />
import { ConfigParams } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { IdentifiableMemoryPersistence } from 'pip-services3-data-nodex';
import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { IBlobsPersistence } from './IBlobsPersistence';
export declare class BlobsMemoryPersistence extends IdentifiableMemoryPersistence<BlobInfoV1, string> implements IBlobsPersistence {
    protected _content: {
        [index: string]: Buffer;
    };
    protected _maxBlobSize: number;
    constructor();
    configure(config: ConfigParams): void;
    private matchString;
    private matchSearch;
    private composeFilter;
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>>;
    markCompleted(correlationId: string, ids: string[]): Promise<void>;
    deleteById(correlationId: string, id: string): Promise<BlobInfoV1>;
    deleteByIds(correlationId: string, ids: string[]): Promise<void>;
    clear(correlationId: string): Promise<void>;
    isUriSupported(): boolean;
    getUri(correlationId: string, id: string): Promise<string>;
    beginWrite(correlationId: string, item: BlobInfoV1): Promise<string>;
    writeChunk(correlationId: string, token: string, chunk: string): Promise<string>;
    endWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1>;
    abortWrite(correlationId: string, token: string): Promise<void>;
    beginRead(correlationId: string, id: string): Promise<BlobInfoV1>;
    readChunk(correlationId: string, id: string, skip: number, take: number): Promise<string>;
    endRead(correlationId: string, id: string): Promise<void>;
}
