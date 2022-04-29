import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { IGetter } from 'pip-services3-data-nodex';
import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
export interface IBlobsPersistence extends IGetter<BlobInfoV1, string> {
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>>;
    getListByIds(correlationId: string, ids: string[]): Promise<BlobInfoV1[]>;
    getOneById(correlationId: string, id: string): Promise<BlobInfoV1>;
    update(correlationId: string, item: BlobInfoV1): Promise<BlobInfoV1>;
    markCompleted(correlationId: string, ids: string[]): Promise<void>;
    deleteById(correlationId: string, id: string): Promise<BlobInfoV1>;
    deleteByIds(correlationId: string, ids: string[]): Promise<void>;
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
