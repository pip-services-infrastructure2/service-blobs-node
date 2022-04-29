const assert = require('chai').assert;

import { Descriptor } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';
import { ConsoleLogger } from 'pip-services3-components-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../../src/data/version1/BlobInfoV1';
import { BlobsMemoryPersistence } from '../../src/persistence/BlobsMemoryPersistence';
import { BlobsController } from '../../src/logic/BlobsController';

suite('BlobsController', ()=> {
    let persistence: BlobsMemoryPersistence;
    let controller: BlobsController;

    suiteSetup(() => {
        persistence = new BlobsMemoryPersistence();
        controller = new BlobsController();

        let logger = new ConsoleLogger();

        let references: References = References.fromTuples(
            new Descriptor('pip-services', 'logger', 'console', 'default', '1.0'), logger,
            new Descriptor('service-blobs', 'persistence', 'memory', 'default', '1.0'), persistence,
            new Descriptor('service-blobs', 'controller', 'default', 'default', '1.0'), controller,
        );
        controller.setReferences(references);
    });
        
    setup(async () => {
        await persistence.clear(null);
    });
    
    test('CRUD Operations', async () => {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary'
        );

        token = await controller.beginBlobWrite(null, blob);

        assert.isNotNull(token);

        // Write blob
        let chunk = Buffer.from([1, 2, 3]).toString('base64');
        token = await controller.writeBlobChunk(null, token, chunk);

        assert.isNotNull(token);

        // Finish writing blob
        chunk = Buffer.from([4, 5, 6]).toString('base64');
        await controller.endBlobWrite(null, token, chunk);

        // Start reading
        blob = await controller.beginBlobRead(null, blobId);

        assert.equal(6, blob.size);

        // Read first chunk
        chunk = await controller.readBlobChunk(null, blobId, 0, 3);

        assert.isString(chunk);

        let buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(1, buffer[0]);
        assert.equal(2, buffer[1]);
        assert.equal(3, buffer[2]);

        // Get blobs
        let page = await controller.getBlobsByFilter(null, null, null);

        assert.lengthOf(page.data, 1);

        // Delete blob
        await controller.deleteBlobsByIds(null, [blobId]);

        // Try to get deleted blob
        blob = await controller.getBlobById(null, blobId);

        assert.isNull(blob);
    });
});