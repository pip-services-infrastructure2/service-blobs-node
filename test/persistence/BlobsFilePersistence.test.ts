import { BlobsFilePersistence } from '../../src/persistence/BlobsFilePersistence';
import { BlobsPersistenceFixture } from './BlobsPersistenceFixture';

suite('BlobsFilePersistence', ()=> {
    let persistence: BlobsFilePersistence;
    let fixture: BlobsPersistenceFixture;
    
    setup(async () => {
        persistence = new BlobsFilePersistence('./data/blobs.test');

        fixture = new BlobsPersistenceFixture(persistence);
        
        await persistence.open(null);
        await persistence.clear(null)
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