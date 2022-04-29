const assert = require('chai').assert;
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

import { Descriptor } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { BlobInfoV1 } from '../../../src/data/version1/BlobInfoV1';
import { BlobsMemoryPersistence } from '../../../src/persistence/BlobsMemoryPersistence';
import { BlobsController } from '../../../src/logic/BlobsController';
import { BlobsCommandableGrpcServiceV1 } from '../../../src/services/version1/BlobsCommandableGrpcServiceV1';

var grpcConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

suite('BlobsCommandableGrpcServiceV1', ()=> {
    let service: BlobsCommandableGrpcServiceV1;

    let client: any;

    suiteSetup(async () => {
        let persistence = new BlobsMemoryPersistence();
        let controller = new BlobsController();

        service = new BlobsCommandableGrpcServiceV1();
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
            __dirname + "../../../../../node_modules/pip-services3-grpc-nodex/src/protos/commandable.proto",
            {
                keepCase: true,
                longs: Number,
                enums: Number,
                defaults: true,
                oneofs: true
            }
        );
        let clientProto = grpc.loadPackageDefinition(packageDefinition).commandable.Commandable;

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
            client.invoke(
                {
                    method: 'v1/blobs.begin_blob_write',
                    args_empty: false,
                    args_json: JSON.stringify({
                        blob: blob
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isFalse(response.result_empty);
        assert.isString(response.result_json);
        token = JSON.parse(response.result_json);

        // Write blob
        let chunk = Buffer.from([1, 2, 3]).toString('base64');

        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.write_blob_chunk',
                    args_empty: false,
                    args_json: JSON.stringify({
                        token: token,
                        chunk: chunk
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isFalse(response.result_empty);
        assert.isString(response.result_json);
        token = JSON.parse(response.result_json);

        // Finish writing blob
        chunk = Buffer.from([4, 5, 6]).toString('base64');

        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.end_blob_write',
                    args_empty: false,
                    args_json: JSON.stringify({
                        token: token,
                        chunk: chunk
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isFalse(response.result_empty);
        assert.isString(response.result_json);

        // Start reading
        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.begin_blob_read',
                    args_empty: false,
                    args_json: JSON.stringify({
                        blob_id: blobId
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isFalse(response.result_empty);
        assert.isString(response.result_json);
        blob = JSON.parse(response.result_json);

        assert.equal(6, blob.size);

        // Read first chunk
        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.read_blob_chunk',
                    args_empty: false,
                    args_json: JSON.stringify({
                        blob_id: blobId,
                        skip: 0,
                        take: 3
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isFalse(response.result_empty);
        assert.isString(response.result_json);
        chunk = JSON.parse(response.result_json);

        assert.isString(chunk);

        let buffer = Buffer.from(chunk, 'base64');
        assert.lengthOf(buffer, 3);
        assert.equal(1, buffer[0]);
        assert.equal(2, buffer[1]);
        assert.equal(3, buffer[2]);
        
        // Get blobs
        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.get_blobs_by_filter',
                    args_empty: false,
                    args_json: JSON.stringify({
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isFalse(response.result_empty);
        assert.isString(response.result_json);
        let page = JSON.parse(response.result_json);

        assert.lengthOf(page.data, 1);
        
        // Delete blob
        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.delete_blobs_by_ids',
                    args_empty: false,
                    args_json: JSON.stringify({
                        blob_ids: [blobId]
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isTrue(response.result_empty);

        // Try to get deleted blob
        response = await new Promise<any>((resolve, reject) => {
            client.invoke(
                {
                    method: 'v1/blobs.get_blob_by_id',
                    args_empty: false,
                    args_json: JSON.stringify({
                        blob_id: blobId
                    })
                },
                (err, response) => {
                    if (err != null) reject(err);
                    else resolve(response);
                }
            );
        });

        assert.isTrue(response.result_empty);
    });
    
});
