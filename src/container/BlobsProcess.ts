import { ProcessContainer } from 'pip-services3-container-nodex';

import { BlobsServiceFactory } from '../build/BlobsServiceFactory';
import { DefaultRpcFactory } from 'pip-services3-rpc-nodex';
import { DefaultGrpcFactory } from 'pip-services3-grpc-nodex';
import { DefaultSwaggerFactory } from 'pip-services3-swagger-nodex';

export class BlobsProcess extends ProcessContainer {

    public constructor() {
        super("blobs", "Blobs microservice");
        this._factories.add(new BlobsServiceFactory);
        this._factories.add(new DefaultRpcFactory);
        this._factories.add(new DefaultGrpcFactory);
        this._factories.add(new DefaultSwaggerFactory);
    }

}
