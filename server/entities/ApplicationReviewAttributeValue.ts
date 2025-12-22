import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { ApplicationReview } from './ApplicationReview';

@Entity()
export class ApplicationReviewAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => ApplicationReview)
    applicationReview!: ApplicationReview;

    constructor(applicationReview: ApplicationReview) {
        super();
        this.applicationReview = applicationReview;
    }
}
