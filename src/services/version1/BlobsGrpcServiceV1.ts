const services = require('../../../../src/protos/blobs_v1_grpc_pb');
const messages = require('../../../../src/protos/blobs_v1_pb');

import { IReferences } from 'pip-services3-commons-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { GrpcService } from 'pip-services3-grpc-nodex';

import { IBlobsController } from '../../logic/IBlobsController';
import { BlobsGrpcConverterV1 } from './BlobsGrpcConverterV1';

export class BlobsGrpcServiceV1 extends GrpcService {
    private _controller: IBlobsController;
	
    public constructor() {
        super(services.BlobsService);
        this._dependencyResolver.put('controller', new Descriptor("service-blobs", "controller", "default", "*", "*"));
    }

	public setReferences(references: IReferences): void {
		super.setReferences(references);
        this._controller = this._dependencyResolver.getOneRequired<IBlobsController>('controller');
    }
    
    private async getBlobsByFilter(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let filter = new FilterParams();
        BlobsGrpcConverterV1.setMap(filter, call.request.getFilterMap());
        let paging = BlobsGrpcConverterV1.toPagingParams(call.request.getPaging());

        let response = new messages.BlobInfoPageReply();

        try {
            let result = await this._controller.getBlobsByFilter(correlationId, filter, paging);
            let page = BlobsGrpcConverterV1.fromBlobInfoPage(result);
            response.setPage(page);
        } catch(err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async getBlobsByIds(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobIds = call.request.getBlobIdsList();

        let response = new messages.BlobInfoObjectsReply();

        try {
            let result = await this._controller.getBlobsByIds(correlationId, blobIds);
            let page = BlobsGrpcConverterV1.fromBlobInfos(result);
            response.setBlobsList(page);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async getBlobById(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobId = call.request.getBlobId();

        let response = new messages.BlobInfoObjectReply();

        try {
            let result = await this._controller.getBlobById(correlationId, blobId);
            let blob = BlobsGrpcConverterV1.fromBlobInfo(result);
            response.setBlob(blob);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async getBlobUriById(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobId = call.request.getBlobId();

        let response = new messages.BlobUriReply();

        try {
            let result = await this._controller.getBlobUriById(correlationId, blobId);
            response.setUri(result);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async beginBlobWrite(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blob = BlobsGrpcConverterV1.toBlobInfo(call.request.getBlob());

        let response = new messages.BlobTokenReply();

        try {
            let result = await this._controller.beginBlobWrite(correlationId, blob);
            response.setToken(result);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async writeBlobChunk(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let token = call.request.getToken();
        let chunk = call.request.getChunk();

        let response = new messages.BlobTokenReply();

        try {
            let result = await this._controller.writeBlobChunk(correlationId, token, chunk);
            response.setToken(result);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async endBlobWrite(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let token = call.request.getToken();
        let chunk = call.request.getChunk();

        let response = new messages.BlobInfoObjectReply();

        try {
            let result = await this._controller.endBlobWrite(correlationId, token, chunk);
            let blob = BlobsGrpcConverterV1.fromBlobInfo(result);
            response.setBlob(blob);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async abortBlobWrite(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let token = call.request.getToken();

        let response = new messages.BlobEmptyReply();

        try {
            await this._controller.abortBlobWrite(correlationId, token);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async beginBlobRead(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobId = call.request.getBlobId();

        let response = new messages.BlobInfoObjectReply();

        try {
            let result = await this._controller.beginBlobRead(correlationId, blobId);
            let blob = BlobsGrpcConverterV1.fromBlobInfo(result);
            response.setBlob(blob);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async readBlobChunk(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobId = call.request.getBlobId();
        let skip = call.request.getSkip();
        let take = call.request.getTake();

        let response = new messages.BlobChunkReply();

        try {
            let result = await this._controller.readBlobChunk(correlationId, blobId, skip, take);
            response.setChunk(result);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async endBlobRead(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobId = call.request.getBlobId();

        let response = new messages.BlobEmptyReply();

        try {
            await this._controller.endBlobRead(correlationId, blobId);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async updateBlobInfo(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blob = BlobsGrpcConverterV1.toBlobInfo(call.request.getBlob());

        let response = new messages.BlobObjectReply();

        try {
            let result = await this._controller.updateBlobInfo(correlationId, blob);
            let grpcBlob = BlobsGrpcConverterV1.fromBlobInfo(result);
            if (result)
                response.setBlob(grpcBlob);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }

    private async markBlobsCompleted(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobIds = call.request.getBlobIdsList();

        let response = new messages.BlobEmptyReply();

        try {
            await this._controller.markBlobsCompleted(correlationId, blobIds);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }    

    private async deleteBlobById(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobId = call.request.getBlobId();

        let response = new messages.BlobEmptyReply();

        try {
            await this._controller.deleteBlobById(correlationId, blobId);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }    

    private async deleteBlobsByIds(call: any): Promise<any> {
        let correlationId = call.request.getCorrelationId();
        let blobIds = call.request.getBlobIdsList();

        let response = new messages.BlobEmptyReply();

        try {
            await this._controller.deleteBlobsByIds(correlationId, blobIds);
        } catch (err) {
            let error = BlobsGrpcConverterV1.fromError(err);
            response.setError(error);
        }

        return response;
    }    

    public register() {
        this.registerMethod(
            'get_blobs_by_filter', 
            null,
            this.getBlobsByFilter
        );

        this.registerMethod(
            'get_blobs_by_ids', 
            null,
            this.getBlobsByIds
        );

        this.registerMethod(
            'get_blob_by_id', 
            null,
            this.getBlobById
        );

        this.registerMethod(
            'get_blob_uri_by_id', 
            null,
            this.getBlobUriById
        );

        this.registerMethod(
            'begin_blob_write', 
            null,
            this.beginBlobWrite
        );

        this.registerMethod(
            'write_blob_chunk', 
            null,
            this.writeBlobChunk
        );

        this.registerMethod(
            'end_blob_write', 
            null,
            this.endBlobWrite
        );

        this.registerMethod(
            'abort_blob_write', 
            null,
            this.abortBlobWrite
        );

        this.registerMethod(
            'begin_blob_read', 
            null,
            this.beginBlobRead
        );

        this.registerMethod(
            'read_blob_chunk', 
            null,
            this.readBlobChunk
        );

        this.registerMethod(
            'end_blob_read', 
            null,
            this.endBlobRead
        );


        this.registerMethod(
            'update_blob_info', 
            null,
            this.updateBlobInfo
        );

        this.registerMethod(
            'mark_blobs_completed', 
            null,
            this.markBlobsCompleted
        );

        this.registerMethod(
            'delete_blob_by_id',
            null, 
            this.deleteBlobById
        );

        this.registerMethod(
            'delete_blobs_by_ids',
            null, 
            this.deleteBlobsByIds
        );

    }
}
