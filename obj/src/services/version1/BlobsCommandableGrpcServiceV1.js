"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobsCommandableGrpcServiceV1 = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_grpc_nodex_1 = require("pip-services3-grpc-nodex");
class BlobsCommandableGrpcServiceV1 extends pip_services3_grpc_nodex_1.CommandableGrpcService {
    constructor() {
        super('v1/blobs');
        this._dependencyResolver.put('controller', new pip_services3_commons_nodex_1.Descriptor('service-blobs', 'controller', 'default', '*', '1.0'));
    }
}
exports.BlobsCommandableGrpcServiceV1 = BlobsCommandableGrpcServiceV1;
//# sourceMappingURL=BlobsCommandableGrpcServiceV1.js.map