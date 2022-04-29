import { ConfigParams } from 'pip-services3-commons-nodex';

import { BlobsS3Persistence } from '../../src/persistence/BlobsS3Persistence';
import { BlobsPersistenceFixture } from './BlobsPersistenceFixture';

suite('BlobsS3Persistence', ()=> {
    let persistence: BlobsS3Persistence;
    let fixture: BlobsPersistenceFixture;

    let S3_ARN = process.env["S3_ARN"] || "";
    let AWS_ACCESS_ID = process.env["AWS_ACCESS_ID"] || "";
    let AWS_ACCESS_KEY = process.env["AWS_ACCESS_KEY"] || "";

    if (S3_ARN == "" || AWS_ACCESS_ID == "" || AWS_ACCESS_KEY == "")
        return;

    setup(async () => {

        let dbConfig = ConfigParams.fromTuples(
            "connection.arn", S3_ARN,
            "credential.access_id", AWS_ACCESS_ID,
            "credential.access_key", AWS_ACCESS_KEY
        );

        persistence = new BlobsS3Persistence();
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