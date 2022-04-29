import { Descriptor } from 'pip-services3-commons-nodex';
import { CommandableGrpcService } from 'pip-services3-grpc-nodex';

export class BlobsCommandableGrpcServiceV1 extends CommandableGrpcService {
    public constructor() {
        super('v1/blobs');
        this._dependencyResolver.put('controller', new Descriptor('service-blobs', 'controller', 'default', '*', '1.0'));
    }
}