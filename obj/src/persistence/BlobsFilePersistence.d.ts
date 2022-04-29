import { ConfigParams } from 'pip-services3-commons-nodex';
import { JsonFilePersister } from 'pip-services3-data-nodex';
import { BlobsMemoryPersistence } from './BlobsMemoryPersistence';
import { BlobInfoV1 } from '../data/version1/BlobInfoV1';
import { TempBlobStorage } from './TempBlobStorage';
export declare class BlobsFilePersistence extends BlobsMemoryPersistence {
    protected _persister: JsonFilePersister<BlobInfoV1>;
    protected _path: string;
    protected _index: string;
    protected _maxBlobSize: number;
    protected _storage: TempBlobStorage;
    constructor(path?: string, index?: string);
    configure(config: ConfigParams): void;
    open(correlationId: string): Promise<void>;
    close(correlationId: string): Promise<void>;
    protected makeFileName(id: string): string;
    isUriSupported(): boolean;
    getUri(correlationId: string, id: string): Promise<string>;
    beginWrite(correlationId: string, item: BlobInfoV1): Promise<string>;
    writeChunk(correlationId: string, token: string, chunk: string): Promise<string>;
    endWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1>;
    abortWrite(correlationId: string, token: string): Promise<void>;
    beginRead(correlationId: string, id: string): Promise<BlobInfoV1>;
    readChunk(correlationId: string, id: string, skip: number, take: number): Promise<string>;
    endRead(correlationId: string, id: string): Promise<void>;
    deleteById(correlationId: string, id: string): Promise<BlobInfoV1>;
    deleteByIds(correlationId: string, ids: string[]): Promise<void>;
    clear(correlationId: string): Promise<void>;
}
