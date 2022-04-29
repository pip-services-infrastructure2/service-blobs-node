/// <reference types="node" />
import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';
export declare class TempBlobStorage implements IConfigurable, IOpenable, ICleanable {
    private _path;
    private _maxBlobSize;
    private _minChunkSize;
    private _cleanupTimeout;
    private _writeTimeout;
    private _cleanupInterval;
    private _opened;
    constructor(path?: string);
    configure(config: ConfigParams): void;
    isOpen(): boolean;
    open(correlationId: string): Promise<void>;
    close(correlationId: string): Promise<void>;
    makeFileName(id: string): string;
    getChunksSize(correlationId: string, id: string): Promise<number>;
    appendChunk(correlationId: string, id: string, buffer: Buffer): Promise<number>;
    readChunks(correlationId: string, id: string): Promise<Buffer>;
    deleteChunks(correlationId: string, id: string): Promise<void>;
    cleanup(correlationId: string): Promise<void>;
    clear(correlationId: string): Promise<void>;
}
