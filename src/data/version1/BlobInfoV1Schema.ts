import { ObjectSchema } from 'pip-services3-commons-nodex';
import { TypeCode } from 'pip-services3-commons-nodex';

export class BlobInfoV1Schema extends ObjectSchema {
    public constructor() {
        super();

        /* Identification */
        this.withOptionalProperty('id', TypeCode.String);
        this.withOptionalProperty('group', TypeCode.String);
        this.withRequiredProperty('name', TypeCode.String);

        /* Content */
        this.withOptionalProperty('size', TypeCode.Long);
        this.withOptionalProperty('content_type', TypeCode.String);
        this.withOptionalProperty('create_time', TypeCode.DateTime);
        this.withOptionalProperty('expire_time', TypeCode.DateTime);
        this.withOptionalProperty('completed', TypeCode.Boolean);

        /* Custom fields */
        this.withOptionalProperty('custom_hdr', null);
        this.withOptionalProperty('custom_dat', null);
    }
}
