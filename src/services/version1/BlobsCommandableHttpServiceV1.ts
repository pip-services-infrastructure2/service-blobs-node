import { Descriptor } from 'pip-services3-commons-nodex';
import { CommandableHttpService } from 'pip-services3-rpc-nodex';

export class BlobsHttpServiceV1 extends CommandableHttpService {
    public constructor() {
        super('v1/blobs');
        this._dependencyResolver.put('controller', new Descriptor('service-blobs', 'controller', 'default', '*', '1.0'));
    }
}