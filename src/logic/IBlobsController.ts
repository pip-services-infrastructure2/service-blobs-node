import { DataPage } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../data/version1/BlobInfoV1';

export interface IBlobsController {
    getBlobsByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>>;
    getBlobsByIds(correlationId: string, blobIds: string[]): Promise<BlobInfoV1[]>;
    getBlobById(correlationId: string, blobId: string): Promise<BlobInfoV1>;

    getBlobUriById(correlationId: string, blobId: string): Promise<string>;

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
