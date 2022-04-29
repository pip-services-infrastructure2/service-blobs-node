"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobsProcess = void 0;
const pip_services3_container_nodex_1 = require("pip-services3-container-nodex");
const BlobsServiceFactory_1 = require("../build/BlobsServiceFactory");
const pip_services3_rpc_nodex_1 = require("pip-services3-rpc-nodex");
const pip_services3_grpc_nodex_1 = require("pip-services3-grpc-nodex");
const pip_services3_swagger_nodex_1 = require("pip-services3-swagger-nodex");
class BlobsProcess extends pip_services3_container_nodex_1.ProcessContainer {
    constructor() {
        super("blobs", "Blobs microservice");
        this._factories.add(new BlobsServiceFactory_1.BlobsServiceFactory);
        this._factories.add(new pip_services3_rpc_nodex_1.DefaultRpcFactory);
        this._factories.add(new pip_services3_grpc_nodex_1.DefaultGrpcFactory);
        this._factories.add(new pip_services3_swagger_nodex_1.DefaultSwaggerFactory);
    }
}
exports.BlobsProcess = BlobsProcess;
//# sourceMappingURL=BlobsProcess.js.map