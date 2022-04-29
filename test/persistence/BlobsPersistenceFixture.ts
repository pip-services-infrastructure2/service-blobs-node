const assert = require('chai').assert;

import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../../src/data/version1/BlobInfoV1';
import { IBlobsPersistence } from '../../src/persistence/IBlobsPersistence';

let BLOB1 = new BlobInfoV1('1', 'test', 'files_image1.jpg', null, 'image/jpg');
let BLOB2 = new BlobInfoV1('2', 'test', 'files_image2.jpg', null, 'image/jpg');

export class BlobsPersistenceFixture {
    private _persistence: IBlobsPersistence;
    
    constructor(persistence: IBlobsPersistence) {
        assert.isNotNull(persistence);
        this._persistence = persistence;
    }

    public async testCrudOperations() {
        let blob1, blob2;

        // Upload one blob
        let token = await this._persistence.beginWrite(null, BLOB1);
        let blob = await this._persistence.endWrite(null, token, '');

        assert.isObject(blob);
        blob1 = blob;

        assert.equal(blob.name, BLOB1.name);
        assert.equal(blob.group, BLOB1.group);
        assert.equal(blob.content_type, BLOB1.content_type);

        // Upload another blob
        token = await this._persistence.beginWrite(null, BLOB2);
        blob = await this._persistence.endWrite(null, token, '');

        assert.isObject(blob);
        blob2 = blob;

        assert.equal(blob.name, BLOB2.name);
        assert.equal(blob.group, BLOB2.group);
        assert.equal(blob.content_type, BLOB2.content_type);

        // Get all blobs
        let blobs = await this._persistence.getPageByFilter(
            null,
            FilterParams.fromValue({
                group: 'test'
            }),
            new PagingParams()
        );

        assert.isObject(blobs);
        assert.lengthOf(blobs.data, 2);

        // Get the blob
        blob = await this._persistence.getOneById(null, blob1.id);

        assert.isObject(blob);
        assert.equal(blob.id, blob1.id);

        // Update the blob
        blob1.name = "file1.xxx";
        blob = await this._persistence.update(null, blob1);

        assert.isObject(blob);
        blob1 = blob;

        assert.equal(blob.id, blob1.id);
        assert.equal(blob.name, 'file1.xxx');

        // Delete the blob
        await this._persistence.deleteById(null, blob1.id);

        // Delete all blobs
        await this._persistence.deleteByIds(null, [blob1.id, blob2.id]);

        // Try to get deleted file
        blob = await this._persistence.getOneById(null, blob2.id);

        assert.isNull(blob || null);
    }

    public async testReadAndWrite() {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary'
        );

        token = await this._persistence.beginWrite(null, blob);

        assert.isNotNull(token);

        // Write first chunk
        let chunk = Buffer.from([1, 2, 3]).toString('base64');
        token = await this._persistence.writeChunk(null, token, chunk);

        assert.isNotNull(token);

        // Write second chunk
        chunk = Buffer.from('\u0004\u0005\u0006', 'utf8').toString('base64');
        token = await this._persistence.writeChunk(null, token, chunk);

        assert.isNotNull(token);

        // Finish writing blob
        blob = await this._persistence.endWrite(null, token, '');
        
        assert.isObject(blob);
        assert.equal(blob.id, blobId);

        // Start reading
        blob = await this._persistence.beginRead(null, blobId);

        assert.isObject(blob);
        assert.equal(blob.id, blobId);
        assert.equal(6, blob.size);
            
        // Read first chunk
        chunk = await this._persistence.readChunk(null, blobId, 0, 3);

        assert.isString(chunk);

        let buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(1, buffer[0]);
        assert.equal(2, buffer[1]);
        assert.equal(3, buffer[2]);

        // Read second chunk
        chunk = await this._persistence.readChunk(null, blobId, 3, 3);

        buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(4, buffer[0]);
        assert.equal(5, buffer[1]);
        assert.equal(6, buffer[2]);

        // Finish reading blob
        await this._persistence.endRead(null, blobId);

        // Finish writing blob
        let uri = await this._persistence.getUri(null, blobId);

        if (this._persistence.isUriSupported())
            assert.isNotNull(uri)
        else
            assert.isNull(uri || null);
        
        // Delete blob
        await this._persistence.deleteByIds(null, [blobId]);

        // Try to read delete blob
        let err: Error;
        try {
            await this._persistence.beginRead(null, blobId);
        } catch(e) {
            err = e;
        }
        
        assert.isNotNull(err);
    }

    public async testWriteInOneChunk() {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'файл-' + blobId + '.dat', 6, 'application/binary'
        );

        token = await this._persistence.beginWrite(null, blob);
        assert.isNotNull(token);

        // Write first and last chunk
        let chunk = Buffer.from([1, 2, 3]).toString('base64');

        await this._persistence.endWrite(null, token, chunk);

        // Start reading
        blob = await this._persistence.beginRead(null, blobId);

        assert.isObject(blob);
        assert.equal(blob.id, blobId);
        assert.equal(3, blob.size);

        // Delete blob
        await this._persistence.deleteById(null, blobId);
    }

    public async testGetUriForMissingBlob() {
        await this._persistence.getUri(null, '123');
    }

    public async testOverrideBlob() {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary'
        );

        token = await this._persistence.beginWrite(null, blob);

        assert.isNotNull(token);

        // Write first and last chunk
        let chunk = Buffer.from([1, 2, 3]).toString('base64');

        blob = await this._persistence.endWrite(null, token, chunk);

        assert.equal(blobId, blob.id);
        assert.equal(3, blob.size);

        // Start writing blob same blob
        blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.bin', 6, 'application/binary'
        );

        token = await this._persistence.beginWrite(null, blob);

        assert.isNotNull(token);

        // Write first and last chunk
        chunk = Buffer.from([3, 4, 5, 6]).toString('base64');

        blob = await this._persistence.endWrite(null, token, chunk);

        assert.equal(blobId, blob.id);
        assert.equal(4, blob.size);
    }
}
