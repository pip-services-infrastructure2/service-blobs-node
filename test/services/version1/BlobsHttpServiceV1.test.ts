const restify = require('restify');
const assert = require('chai').assert;

import { ConfigParams, FilterParams } from 'pip-services3-commons-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../../../src/data/version1/BlobInfoV1';
import { BlobsMemoryPersistence } from '../../../src/persistence/BlobsMemoryPersistence';
import { BlobsController } from '../../../src/logic/BlobsController';
import { BlobsHttpServiceV1 } from '../../../src/services/version1/BlobsCommandableHttpServiceV1';

let httpConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);


suite('BlobsHttpServiceV1', ()=> {
    let service: BlobsHttpServiceV1;
    let persistence: BlobsMemoryPersistence;
    let rest: any;

    suiteSetup(async () => {
        persistence = new BlobsMemoryPersistence();
        let controller = new BlobsController();

        service = new BlobsHttpServiceV1();
        service.configure(httpConfig);

        let references: References = References.fromTuples(
            new Descriptor('service-blobs', 'persistence', 'memory', 'default', '1.0'), persistence,
            new Descriptor('service-blobs', 'controller', 'default', 'default', '1.0'), controller,
            new Descriptor('service-blobs', 'service', 'http', 'default', '1.0'), service
        );
        controller.setReferences(references);
        service.setReferences(references);

        await service.open(null);
    });
    
    suiteTeardown(async () => {
        await service.close(null);
    });

    setup(async () => {
        let url = 'http://localhost:3000';
        rest = restify.createJsonClient({ url: url, version: '*' });

        await persistence.open(null);
        await persistence.clear(null);
    });
    
    test('CRUD Operations', async () => {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary'
        );

        token = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/begin_blob_write',
                {
                    blob: blob
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isNotNull(token);

        // Write blob
        let chunk = Buffer.from([1, 2, 3]).toString('base64');
        token = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/write_blob_chunk',
                {
                    token: token,
                    chunk: chunk
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isNotNull(token);

        // Finish writing blob
        chunk = Buffer.from([4, 5, 6]).toString('base64');
        token = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/end_blob_write',
                {
                    token: token,
                    chunk: chunk
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isNotNull(token);

        // Start reading
        blob = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/begin_blob_read',
                {
                    blob_id: blobId
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.equal(6, blob.size);

        // Read first chunk
        chunk = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/read_blob_chunk',
                {
                    blob_id: blobId,
                    skip: 0,
                    take: 3
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isString(chunk);

        let buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(1, buffer[0]);
        assert.equal(2, buffer[1]);
        assert.equal(3, buffer[2]);

        // Get blobs
        let page = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/get_blobs_by_filter',
                {
                    // filter: FilterParams.fromTuples(
                    //     'expired', false
                    // )
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.lengthOf(page.data, 1);

        // Delete blob
        await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/delete_blobs_by_ids',
                {
                    blob_ids: [blobId]
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        // Try to get deleted blob
        blob = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/get_blob_by_id',
                {
                    blob_id: blobId
                },
                (err, req, res, result) => {
                    if (err == null) resolve(Object.keys(result).length == 0 ? null : result);
                    else reject(err);
                }
            );
        });

        assert.isNull(blob);
    });

    test('Blob expiration', async () => {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary', new Date(1980, 1, 1)
        );

        token = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/begin_blob_write',
                {
                    blob: blob
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        // Write blob
        let chunk = Buffer.from([1, 2, 3]).toString('base64');
        token = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/write_blob_chunk',
                {
                    token: token,
                    chunk: chunk
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        // Finish writing blob
        chunk = Buffer.from([4, 5, 6]).toString('base64');

        blob = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/end_blob_write',
                {
                    token: token,
                    chunk: chunk
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        // Get blobs
        let page = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/get_blobs_by_filter',
                {
                    filter: FilterParams.fromTuples('expired', false)
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.lengthOf(page.data, 0);

        // Delete blob
        await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/delete_blobs_by_ids',
                {
                    blob_ids: [blobId]
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        // Try to get deleted blob
        blob = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/blobs/get_blob_by_id',
                {
                    blob_id: blobId
                },
                (err, req, res, result) => {
                    if (err == null) resolve(Object.keys(result).length == 0 ? null : result);
                    else reject(err);
                }
            );
        });

        assert.isNull(blob);
    });
});