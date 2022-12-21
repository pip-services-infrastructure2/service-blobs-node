# Blobs Microservice

This is blob blobs microservice from Pip.Services library. 
It stores large binary blobs, manages references to them from other entities and serves stored content to users.
Most often binary blobs are used to store images and document attachments. 

The microservice currently supports the following deployment options:
* Deployment platforms: Standalone Process, Seneca
* External APIs: HTTP/REST, Seneca
* Persistence: Memory, Flat Files, MongoDB, AWS S3

This microservice has no dependencies on other microservices.

<a name="links"></a> Quick Links:

* [Download Links](doc/Downloads.md)
* [Development Guide](doc/Development.md)
* [Configuration Guide](doc/Configuration.md)
* [Deployment Guide](doc/Deployment.md)
* Client SDKs
  - [Node.js SDK](https://github.com/pip-services-infrastructure2/client-blobs-node)
* Communication Protocols
  - [HTTP Version 1](doc/HttpProtocolV1.md)
  - [Seneca Version 1](doc/SenecaProtocolV1.md)

##  Contract

Logical contract of the microservice is presented below. For physical implementation (HTTP/REST, Thrift, Seneca, Lambda, etc.),
please, refer to documentation of the specific protocol.

```typescript
class BlobInfoV1 {
    /* Identification */
    public id: string;
    public group: string;
    public name: string;

    /* Content */
    public size: number;
    public content_type: string;
    public create_time: Date;
    public expire_time: Date;
    public completed: boolean;
}

interface IBlobsV1 {
    getBlobsByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<BlobInfoV1>>;
    getBlobsByIds(correlationId: string, blobIds: string[]): Promise<BlobInfoV1[]>;
    getBlobById(correlationId: string, blobId: string): Promise<BlobInfoV1>;

    getBlobUri(correlationId: string, blobId: string): Promise<string>;

    beginBlobWrite(correlationId: string, blob: BlobInfoV1): Promise<string>;
    writeBlobChunk(correlationId: string, token: string, chunk: string): Promise<string>;
    endBlobWrite(correlationId: string, token: string, chunk: string): Promise<BlobInfoV1>;
    abortBlobWrite(correlationId: string, token: string): Promise<void>;
    
    beginBlobRead(correlationId: string, blobId: string): Promise<BlobInfoV1>;
    readBlobChunk(correlationId: string, blobId: string, skip: number, take: number): Promise<string>;
    endBlobRead(correlationId: string, blobId: string): Promise<void>;

    updateBlobInfo(correlationId: string, blob: BlobInfoV1): Promise<BlobInfoV1>;
    markBlobsCompleted(correlationId: string, blobIds: string[]): Promise<void>;

    deleteBlobById(correlationId: string, blobId: string): Promise<BlobInfoV1>;

    deleteBlobsByIds(correlationId: string, blobIds: string[]): Promise<void>;
}
```

## Download

Right now the only way to get the microservice is to check it out directly from github repository
```bash
git clone git@github.com:pip-services-infrastructure2/service-blobs-node.git
```

Pip.Service team is working to implement packaging and make stable releases available for your 
as zip downloadable archieves.

## Run

Add **config.yaml** file to the root of the microservice folder and set configuration parameters.
As the starting point you can use example configuration from **config.example.yaml** file. 

Example of microservice configuration
```yaml
{    
---
- descriptor: "pip-services-commons:logger:console:default:1.0"
  level: "trace"

- descriptor: "service-blobs:persistence:file:default:1.0"
  path: "./data/blobs"

- descriptor: "service-blobs:controller:default:default:1.0"

- descriptor: "service-blobs:service:commandable-http:default:1.0"
  connection:
    protocol: "http"
    host: "0.0.0.0"
    port: 8080
}
```
 
For more information on the microservice configuration see [Configuration Guide](Configuration.md).

Start the microservice using the command:
```bash
node run
```

## Use

The easiest way to work with the microservice is to use client SDK. 
The complete list of available client SDKs for different languages is listed in the [Quick Links](#links)

If you use Node.js then you should add dependency to the client SDK into **package.json** file of your project
```javascript
{
    ...
    "dependencies": {
        ....
        "client-blobs-node": "^1.0.*",
        ...
    }
}
```

Inside your code get the reference to the client SDK
```javascript
var sdk = new require('client-blobs-node');
```

Define client configuration parameters that match configuration of the microservice external API
```javascript
// Client configuration
var config = {
    connection: {
        protocol: 'http',
        host: 'localhost', 
        port: 8080
    }
};
```

Instantiate the client and open connection to the microservice
```javascript
// Create the client instance
var client = sdk.BlobsRestClient(config);

// Connect to the microservice
await client.open(null);

// Work with the microservice
...
```

Now the client is ready to perform operations
```javascript
// Create a new picture
var blob = {
    group: "pictures",
    name: "google_search.jpg"
};

await client.createBlobFromUrl(
    null,
    blob,
    "https://www.google.com/logos/doodles/2016/doodle-4-google-2016-us-winner-5664555055185920-hp.jpg",
);
```

```javascript
// Start reading blobs in chunks
let size = await client.beginBlobRead(
    null,
    blob_id
);

let chunk = await client.readBlobChunk(
    null, blob_id, 0, size
);
```    

## Acknowledgements

This microservice was created and currently maintained by *Sergey Seroukhov*.

