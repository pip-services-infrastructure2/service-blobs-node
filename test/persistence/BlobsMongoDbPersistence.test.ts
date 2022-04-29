import { ConfigParams } from 'pip-services3-commons-nodex';

import { BlobsMongoDbPersistence } from '../../src/persistence/BlobsMongoDbPersistence';
import { BlobsPersistenceFixture } from './BlobsPersistenceFixture';

suite('BlobsMongoDbPersistence', ()=> {
    let persistence: BlobsMongoDbPersistence;
    let fixture: BlobsPersistenceFixture;

    setup(async () => {
        var MONGO_DB = process.env["MONGO_DB"] || "test";
        var MONGO_COLLECTION = process.env["MONGO_COLLECTION"] || "blobs";
        var MONGO_SERVICE_HOST = process.env["MONGO_SERVICE_HOST"] || "localhost";
        var MONGO_SERVICE_PORT = process.env["MONGO_SERVICE_PORT"] || "27017";
        var MONGO_SERVICE_URI = process.env["MONGO_SERVICE_URI"];

        var dbConfig = ConfigParams.fromTuples(
            "collection", MONGO_COLLECTION,
            "connection.database", MONGO_DB,
            "connection.host", MONGO_SERVICE_HOST,
            "connection.port", MONGO_SERVICE_PORT,
            "connection.uri", MONGO_SERVICE_URI
        );

        persistence = new BlobsMongoDbPersistence();
        persistence.configure(dbConfig);

        fixture = new BlobsPersistenceFixture(persistence);

        await persistence.open(null);
        await persistence.clear(null);
    });
    
    teardown(async () => {
        await persistence.close(null);
    });

    test('CRUD Operations', async () => {
        await fixture.testCrudOperations();
    });

    test('Read and Write', async () => {
        await fixture.testReadAndWrite();
    });

    test('Write in One Chunk', async () => {
        await fixture.testWriteInOneChunk();
    });

    test('Get Uri for missing blob', async () => {
        await fixture.testGetUriForMissingBlob();
    });

    test('Override blob', async () => {
        await fixture.testOverrideBlob();
    });

});