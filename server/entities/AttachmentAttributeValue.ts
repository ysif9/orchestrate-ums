import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Attachment } from './Attachment';

@Entity()
export class AttachmentAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Attachment)
    attachment!: Attachment;

    constructor(attachment: Attachment) {
        super();
        this.attachment = attachment;
    }
}
