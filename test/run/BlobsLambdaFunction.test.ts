const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../../src/data/version1/BlobInfoV1';
import { BlobsLambdaFunction } from '../../src/container/BlobsLambdaFunction';

suite('BlobsLambdaFunction', ()=> {
    let lambda: BlobsLambdaFunction;

    suiteSetup(async () => {
        let config = ConfigParams.fromTuples(
            'logger.descriptor', 'pip-services:logger:console:default:1.0',
            'persistence.descriptor', 'service-blobs:persistence:memory:default:1.0',
            'controller.descriptor', 'service-blobs:controller:default:default:1.0'
        );

        lambda = new BlobsLambdaFunction();
        lambda.configure(config);
        await lambda.open(null);
    });
    
    suiteTeardown(async () => {
        await lambda.close(null);
    });
    
    test('CRUD Operations', async () => {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary'
        );
        
        token = await lambda.act(
            {
                role: 'blobs',
                cmd: 'begin_blob_write',
                blob: blob
            }
        );

        assert.isNotNull(token);

        // Write blob
        let chunk = Buffer.from([1, 2, 3]).toString('base64');
        token = await lambda.act(
            {
                role: 'blobs',
                cmd: 'write_blob_chunk',
                blob_id: blobId,
                token: token,
                chunk: chunk
            }
        );

        assert.isNotNull(token);

        // Finish writing blob
        chunk = Buffer.from([4, 5, 6]).toString('base64');
        await lambda.act(
            {
                role: 'blobs',
                cmd: 'end_blob_write',
                blob_id: blobId,
                token: token,
                chunk: chunk
            }
        );

        // Start reading
        blob = await lambda.act(
            {
                role: 'blobs',
                cmd: 'begin_blob_read',
                blob_id: blobId
            }
        );

        assert.equal(6, blob.size);

        // Read first chunk
        chunk = await lambda.act(
            {
                role: 'blobs',
                cmd: 'read_blob_chunk',
                blob_id: blobId,
                skip: 0,
                take: 3
            }
        );

        assert.isString(chunk);

        let buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(1, buffer[0]);
        assert.equal(2, buffer[1]);
        assert.equal(3, buffer[2]);

        // Get blobs
        let page = await lambda.act(
            {
                role: 'blobs',
                cmd: 'get_blobs_by_filter'
            }
        );

        assert.lengthOf(page.data, 1);

        // Delete blob
        await lambda.act(
            {
                role: 'blobs',
                cmd: 'delete_blobs_by_ids',
                blob_ids: [blobId]
            }
        );

        // Try to get deleted blob
        blob = await lambda.act(
            {
                role: 'blobs',
                cmd: 'get_blob_by_id',
                blob_id: blobId
            }
        );

        assert.isNull(blob);
    });
});