import { Descriptor } from 'pip-services3-commons-nodex';
import { CommandableLambdaFunction } from 'pip-services3-aws-nodex';

import { BlobsServiceFactory } from '../build/BlobsServiceFactory';

export class BlobsLambdaFunction extends CommandableLambdaFunction {
    public constructor() {
        super("blobs", "Blobs function");
        this._dependencyResolver.put('controller', new Descriptor('service-blobs', 'controller', 'default', '*', '*'));
        this._factories.add(new BlobsServiceFactory());
    }
}

export const handler = new BlobsLambdaFunction().getHandler();