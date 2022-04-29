const assert = require('chai').assert;
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

import { Descriptor } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { BlobsMemoryPersistence } from '../../../src/persistence/BlobsMemoryPersistence';
import { BlobsController } from '../../../src/logic/BlobsController';
import { BlobsGrpcServiceV1 } from '../../../src/services/version1/BlobsGrpcServiceV1';
import { BlobInfoV1 } from '../../../src/data/version1/BlobInfoV1';

var grpcConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

suite('BlobsGrpcServiceV1', ()=> {
    let service: BlobsGrpcServiceV1;

    let client: any;

    suiteSetup(async () => {
        let persistence = new BlobsMemoryPersistence();
        let controller = new BlobsController();

        service = new BlobsGrpcServiceV1();
        service.configure(grpcConfig);

        let references: References = References.fromTuples(
            new Descriptor('service-blobs', 'persistence', 'memory', 'default', '1.0'), persistence,
            new Descriptor('service-blobs', 'controller', 'default', 'default', '1.0'), controller,
            new Descriptor('service-blobs', 'service', 'grpc', 'default', '1.0'), service
        );
        controller.setReferences(references);
        service.setReferences(references);

        await service.open(null);
    });
    
    suiteTeardown(async () => {
        await service.close(null);
    });

    setup(() => {
        let packageDefinition = protoLoader.loadSync(
            __dirname + "../../../../../src/protos/blobs_v1.proto",
            {
                keepCase: true,
                longs: Number,
                enums: Number,
                defaults: true,
                oneofs: true
            }
        );
        let clientProto = grpc.loadPackageDefinition(packageDefinition).blobs_v1.Blobs;

        client = new clientProto('localhost:3000', grpc.credentials.createInsecure());
    });

    test('CRUD Operations', async () => {
        let blobId = IdGenerator.nextLong();
        let token: string = null;

        // Start writing blob
        let blob = new BlobInfoV1(
            blobId, 'test', 'file-' + blobId + '.dat', 6, 'application/binary'
        );
        
        let response = await new Promise<any>((resolve, reject) => {
            client.begin_blob_write(
                {
                    blob: blob
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        token = response ? response.token : null;

        // Write blob
        let chunk = Buffer.from([1, 2, 3]).toString('base64');
        response = await new Promise<any>((resolve, reject) => {
            client.write_blob_chunk(
                {
                    token: token,
                    chunk: chunk
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        // Finish writing blob
        chunk = Buffer.from([4, 5, 6]).toString('base64');
        response = await new Promise<any>((resolve, reject) => {
            client.end_blob_write(
                {
                    token: token,
                    chunk: chunk
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        // Start reading
        response = await new Promise<any>((resolve, reject) => {
            client.begin_blob_read(
                {
                    blob_id: blobId
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        blob = response ? response.blob : null;
        assert.equal(6, blob.size);

        // Read first chunk
        response = await new Promise<any>((resolve, reject) => {
            client.read_blob_chunk(
                {
                    blob_id: blobId,
                    skip: 0,
                    take: 3
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        chunk = response ? response.chunk : null;

        assert.isString(chunk);

        let buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(1, buffer[0]);
        assert.equal(2, buffer[1]);
        assert.equal(3, buffer[2]);

        // Get blobs
        response = await new Promise<any>((resolve, reject) => {
            client.get_blobs_by_filter(
                {
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        let page = response ? response.page : null;

        assert.lengthOf(page.data, 1);

        // Delete blob
        await new Promise<any>((resolve, reject) => {
            client.delete_blobs_by_ids(
                {
                    blob_ids: [blobId]
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        // Try to get deleted blob
        response = await new Promise<any>((resolve, reject) => {
            client.get_blob_by_id(
                {
                    blob_id: blobId
                },
                (err, response) => {
                    if (err != null || response.error != null) reject(err ?? response.error);
                    else resolve(response);
                }
            );
        });

        blob = response ? response.blob : null;

        assert.isNull(blob);
    });
    
});
