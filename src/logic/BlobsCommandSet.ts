import { CommandSet } from 'pip-services3-commons-nodex';
import { ICommand } from 'pip-services3-commons-nodex';
import { Command } from 'pip-services3-commons-nodex';
import { Parameters } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { ObjectSchema } from 'pip-services3-commons-nodex';
import { ArraySchema } from 'pip-services3-commons-nodex';
import { TypeCode } from 'pip-services3-commons-nodex';
import { FilterParamsSchema } from 'pip-services3-commons-nodex';
import { PagingParamsSchema } from 'pip-services3-commons-nodex';

import { IBlobsController } from './IBlobsController';
import { BlobInfoV1Schema } from '../data/version1/BlobInfoV1Schema';

export class BlobsCommandSet extends CommandSet {
    private _logic: IBlobsController;

    constructor(logic: IBlobsController) {
        super();

        this._logic = logic;

		this.addCommand(this.makeGetBlobsByFilterCommand());
		this.addCommand(this.makeGetBlobsByIdsCommand());
		this.addCommand(this.makeGetBlobByIdCommand());
		this.addCommand(this.makeGetBlobUriByIdCommand());
		
		this.addCommand(this.makeBeginBlobWriteCommand());
		this.addCommand(this.makeWriteBlobChunkCommand());
		this.addCommand(this.makeEndBlobWriteCommand());
		this.addCommand(this.makeAbortBlobWriteCommand());

		this.addCommand(this.makeBeginBlobReadCommand());
		this.addCommand(this.makeReadBlobChunkCommand());
		this.addCommand(this.makeEndBlobReadCommand());

		this.addCommand(this.makeUpdateBlobInfoCommand());
		this.addCommand(this.makeMarkBlobsCompletedCommand());
		this.addCommand(this.makeDeleteBlobByIdCommand());
		this.addCommand(this.makeDeleteBlobsByIdsCommand());
    }

	private makeGetBlobsByFilterCommand(): ICommand {
		return new Command(
			"get_blobs_by_filter",
			new ObjectSchema(true)
				.withOptionalProperty("filter", new FilterParamsSchema())
				.withOptionalProperty("paging", new PagingParamsSchema())
			,
            async (correlationId: string, args: Parameters) => {
                let filter = FilterParams.fromValue(args.get("filter"));
                let paging = PagingParams.fromValue(args.get("paging"));
                return await this._logic.getBlobsByFilter(correlationId, filter, paging);
            }
		);
	}

	private makeGetBlobsByIdsCommand(): ICommand {
		return new Command(
			"get_blobs_by_ids",
			new ObjectSchema(true)
				.withRequiredProperty("blob_ids", new ArraySchema(TypeCode.String)),
			async (correlationId: string, args: Parameters) => {
				let temp: string = args.getAsString("blob_ids");
				let blobIds = temp.split(',');
				return await this._logic.getBlobsByIds(correlationId, blobIds);
            }
		);
	}

	private makeGetBlobByIdCommand(): ICommand {
		return new Command(
			"get_blob_by_id",
			new ObjectSchema(true)
				.withRequiredProperty("blob_id", TypeCode.String),
			async (correlationId: string, args: Parameters) => {
                let blobId = args.getAsNullableString("blob_id");
				return await this._logic.getBlobById(correlationId, blobId);
            }
		);
	}

	private makeGetBlobUriByIdCommand(): ICommand {
		return new Command(
			"get_blob_uri_by_id",
			new ObjectSchema(true)
				.withRequiredProperty("blob_id", TypeCode.String),
			async (correlationId: string, args: Parameters) => {
                let blobId = args.getAsNullableString("blob_id");
				return await this._logic.getBlobUriById(correlationId, blobId);
            }
		);
	}

	private makeBeginBlobWriteCommand(): ICommand {
		return new Command(
			"begin_blob_write",
			new ObjectSchema(true)
				.withRequiredProperty("blob", new BlobInfoV1Schema()),
			async (correlationId: string, args: Parameters) => {
				let blob = args.get("blob");
				return await this._logic.beginBlobWrite(correlationId, blob);
            }
		);
	}

	private makeWriteBlobChunkCommand(): ICommand {
		return new Command(
			"write_blob_chunk",
			new ObjectSchema(true)
                .withRequiredProperty("token", TypeCode.String)
                .withRequiredProperty("chunk", TypeCode.String),				
			async (correlationId: string, args: Parameters) => {
                let token = args.getAsNullableString("token");
                let chunk = args.getAsNullableString("chunk");
				return await this._logic.writeBlobChunk(correlationId, token, chunk);
            }
		);
	}

	private makeEndBlobWriteCommand(): ICommand {
		return new Command(
			"end_blob_write",
			new ObjectSchema(true)
                .withRequiredProperty("token", TypeCode.String)
                .withOptionalProperty("chunk", TypeCode.String),				
			async (correlationId: string, args: Parameters) => {
                let token = args.getAsNullableString("token");
                let chunk = args.getAsNullableString("chunk");
				return await this._logic.endBlobWrite(correlationId, token, chunk);
            }
		);
	}

	private makeAbortBlobWriteCommand(): ICommand {
		return new Command(
			"abort_blob_write",
			new ObjectSchema(true)
                .withRequiredProperty("token", TypeCode.String),
			async (correlationId: string, args: Parameters) => {
                let token = args.getAsNullableString("token");
				return await this._logic.abortBlobWrite(correlationId, token);
            }
		);
	}

	private makeBeginBlobReadCommand(): ICommand {
		return new Command(
			"begin_blob_read",
			new ObjectSchema(true)
				.withRequiredProperty("blob_id", TypeCode.String),
			async (correlationId: string, args: Parameters) => {
                let blobId = args.getAsNullableString("blob_id");
				return await this._logic.beginBlobRead(correlationId, blobId);
            }
		);
	}

	private makeReadBlobChunkCommand(): ICommand {
		return new Command(
			"read_blob_chunk",
			new ObjectSchema(true)
				.withRequiredProperty("blob_id", TypeCode.String)
                .withRequiredProperty("skip", TypeCode.Long)
                .withRequiredProperty("take", TypeCode.Long),				
			async (correlationId: string, args: Parameters) => {
                let blobId = args.getAsNullableString("blob_id");
                let skip = args.getAsNullableLong("skip");
                let take = args.getAsNullableLong("take");
				return await this._logic.readBlobChunk(correlationId, blobId, skip, take);
            }
		);
	}

	private makeEndBlobReadCommand(): ICommand {
		return new Command(
			"end_blob_read",
			new ObjectSchema(true)
				.withRequiredProperty("blob_id", TypeCode.String),				
			async (correlationId: string, args: Parameters) => {
                let blobId = args.getAsNullableString("blob_id");
				return await this._logic.endBlobRead(correlationId, blobId);
            }
		);
	}

	private makeUpdateBlobInfoCommand(): ICommand {
		return new Command(
			"update_blob_info",
			new ObjectSchema(true)
				.withRequiredProperty("blob", new BlobInfoV1Schema()),
			async (correlationId: string, args: Parameters) => {
                let blob = args.get("blob");
				return await this._logic.updateBlobInfo(correlationId, blob);
            }
		);
	}

	private makeMarkBlobsCompletedCommand(): ICommand {
		return new Command(
			"mark_blobs_completed",
			new ObjectSchema(true)
				.withRequiredProperty("blob_ids", new ArraySchema(TypeCode.String)),
			async (correlationId: string, args: Parameters) => {
                let blobIds = args.get("blob_ids");
				return await this._logic.markBlobsCompleted(correlationId, blobIds);
            }
		);
	}

	private makeDeleteBlobByIdCommand(): ICommand {
		return new Command(
			"delete_blob_by_id",
			new ObjectSchema(true)
				.withRequiredProperty("blob_id", TypeCode.String),
			async (correlationId: string, args: Parameters) => {
                let blobId = args.getAsNullableString("blob_id");
				return await this._logic.deleteBlobById(correlationId, blobId);
			}
		);
	}

	private makeDeleteBlobsByIdsCommand(): ICommand {
		return new Command(
			"delete_blobs_by_ids",
			new ObjectSchema(true)
				.withRequiredProperty("blob_ids", new ArraySchema(TypeCode.String)),
			async (correlationId: string, args: Parameters) => {
                let blobIds = args.get("blob_ids");
				return await this._logic.deleteBlobsByIds(correlationId, blobIds);
			}
		);
	}

}