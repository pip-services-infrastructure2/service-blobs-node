const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-nodex';
import { IdGenerator } from 'pip-services3-commons-nodex';

import { TempBlobStorage } from '../../src/persistence/TempBlobStorage';

suite('TempBlobStorage', ()=> {
    let storage: TempBlobStorage;
    
    setup(async () => {
        storage = new TempBlobStorage();

        storage.configure(ConfigParams.fromTuples(
            'temp_path', './data/temp',
            'options.write_timeout', 0,
            'options.min_chunk_size', 5
        ));
        
        await storage.open(null);
        await storage.clear(null);
    });
    
    teardown(async () => {
        await storage.close(null);
    });
        
    test('Read and Write', async () => {
        let id = IdGenerator.nextLong();

        // Write the first chunk
        let chunk = Buffer.from('ABC');
        let size = await storage.appendChunk(null, id, chunk);

        assert.equal(3, size);

        // Write second chunk
        chunk = Buffer.from('DEF');
        size = await storage.appendChunk(null, id, chunk);
        assert.equal(6, size);

        // Read chunks size
        size = await storage.getChunksSize(null, id);

        assert.equal(6, size);

        // Delete chunks
        await storage.deleteChunks(null, id);
    });

    test('Append and Cleanup', async () => {
        let id = IdGenerator.nextLong();
        let chunk = Buffer.from('ABC');

        // Create a new blob
        await storage.appendChunk(null, id, chunk);

        // Cleanup chunks
        await storage.cleanup(null);
    });

});