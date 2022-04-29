"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.BlobsLambdaFunction = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_aws_nodex_1 = require("pip-services3-aws-nodex");
const BlobsServiceFactory_1 = require("../build/BlobsServiceFactory");
class BlobsLambdaFunction extends pip_services3_aws_nodex_1.CommandableLambdaFunction {
    constructor() {
        super("blobs", "Blobs function");
        this._dependencyResolver.put('controller', new pip_services3_commons_nodex_1.Descriptor('service-blobs', 'controller', 'default', '*', '*'));
        this._factories.add(new BlobsServiceFactory_1.BlobsServiceFactory());
    }
}
exports.BlobsLambdaFunction = BlobsLambdaFunction;
exports.handler = new BlobsLambdaFunction().getHandler();
//# sourceMappingURL=BlobsLambdaFunction.js.map