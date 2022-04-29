"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobInfoV1Schema = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
class BlobInfoV1Schema extends pip_services3_commons_nodex_1.ObjectSchema {
    constructor() {
        super();
        /* Identification */
        this.withOptionalProperty('id', pip_services3_commons_nodex_2.TypeCode.String);
        this.withOptionalProperty('group', pip_services3_commons_nodex_2.TypeCode.String);
        this.withRequiredProperty('name', pip_services3_commons_nodex_2.TypeCode.String);
        /* Content */
        this.withOptionalProperty('size', pip_services3_commons_nodex_2.TypeCode.Long);
        this.withOptionalProperty('content_type', pip_services3_commons_nodex_2.TypeCode.String);
        this.withOptionalProperty('create_time', pip_services3_commons_nodex_2.TypeCode.DateTime);
        this.withOptionalProperty('expire_time', pip_services3_commons_nodex_2.TypeCode.DateTime);
        this.withOptionalProperty('completed', pip_services3_commons_nodex_2.TypeCode.Boolean);
        /* Custom fields */
        this.withOptionalProperty('custom_hdr', null);
        this.withOptionalProperty('custom_dat', null);
    }
}
exports.BlobInfoV1Schema = BlobInfoV1Schema;
//# sourceMappingURL=BlobInfoV1Schema.js.map