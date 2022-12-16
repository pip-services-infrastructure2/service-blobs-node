import { Factory } from 'pip-services3-components-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';

import { BlobsMongoDbPersistence } from '../persistence/BlobsMongoDbPersistence';
import { BlobsFilePersistence } from '../persistence/BlobsFilePersistence';
import { BlobsMemoryPersistence } from '../persistence/BlobsMemoryPersistence';

import { BlobsController } from '../logic/BlobsController';
import { BlobsHttpServiceV1 } from '../services/version1/BlobsCommandableHttpServiceV1';
import { BlobsCommandableGrpcServiceV1 } from '../services/version1/BlobsCommandableGrpcServiceV1';
import { BlobsGrpcServiceV1 } from '../services/version1/BlobsGrpcServiceV1';

export class BlobsServiceFactory extends Factory {
	public static Descriptor = new Descriptor("service-blobs", "factory", "default", "default", "1.0");

	public static MemoryPersistenceDescriptor = new Descriptor("service-blobs", "persistence", "memory", "*", "1.0");
	public static FilePersistenceDescriptor = new Descriptor("service-blobs", "persistence", "file", "*", "1.0");
	public static MongoDbPersistenceDescriptor = new Descriptor("service-blobs", "persistence", "mongodb", "*", "1.0");
	public static S3PersistenceDescriptor = new Descriptor("service-blobs", "persistence", "s3", "*", "1.0");

	public static ControllerDescriptor = new Descriptor("service-blobs", "controller", "default", "*", "1.0");
	public static HttpServiceDescriptor = new Descriptor("service-blobs", "service", "commandable-http", "*", "1.0");
	public static CommandableGrpcServiceDescriptor = new Descriptor("service-blobs", "service", "commandable-grpc", "*", "1.0");
	public static GrpcServiceDescriptor = new Descriptor("service-blobs", "service", "grpc", "*", "1.0");
	
	constructor() {
		super();
		this.registerAsType(BlobsServiceFactory.MemoryPersistenceDescriptor, BlobsMemoryPersistence);
		this.registerAsType(BlobsServiceFactory.FilePersistenceDescriptor, BlobsFilePersistence);
		this.registerAsType(BlobsServiceFactory.MongoDbPersistenceDescriptor, BlobsMongoDbPersistence);
		this.registerAsType(BlobsServiceFactory.S3PersistenceDescriptor, BlobsMongoDbPersistence);

		this.registerAsType(BlobsServiceFactory.ControllerDescriptor, BlobsController);
		this.registerAsType(BlobsServiceFactory.HttpServiceDescriptor, BlobsHttpServiceV1);
		this.registerAsType(BlobsServiceFactory.CommandableGrpcServiceDescriptor, BlobsCommandableGrpcServiceV1);
		this.registerAsType(BlobsServiceFactory.GrpcServiceDescriptor, BlobsGrpcServiceV1);
	}
	
}
