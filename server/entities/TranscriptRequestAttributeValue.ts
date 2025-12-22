import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { TranscriptRequest } from './TranscriptRequest';

@Entity()
export class TranscriptRequestAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => TranscriptRequest)
    transcriptRequest!: TranscriptRequest;

    constructor(transcriptRequest: TranscriptRequest) {
        super();
        this.transcriptRequest = transcriptRequest;
    }
}
