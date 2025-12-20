import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Assessment } from './Assessment';

@Entity()
export class AssessmentAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Assessment)
    assessment!: Assessment;

    constructor(assessment: Assessment) {
        super();
        this.assessment = assessment;
    }
}
