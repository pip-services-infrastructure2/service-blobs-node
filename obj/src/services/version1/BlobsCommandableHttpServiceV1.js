"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobsHttpServiceV1 = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_rpc_nodex_1 = require("pip-services3-rpc-nodex");
class BlobsHttpServiceV1 extends pip_services3_rpc_nodex_1.CommandableHttpService {
    constructor() {
        super('v1/blobs');
        this._dependencyResolver.put('controller', new pip_services3_commons_nodex_1.Descriptor('service-blobs', 'controller', 'default', '*', '1.0'));
    }
}
exports.BlobsHttpServiceV1 = BlobsHttpServiceV1;
//# sourceMappingURL=BlobsCommandableHttpServiceV1.js.map