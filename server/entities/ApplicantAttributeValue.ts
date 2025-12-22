import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Applicant } from './Applicant';

@Entity()
export class ApplicantAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Applicant)
    applicant!: Applicant;

    constructor(applicant: Applicant) {
        super();
        this.applicant = applicant;
    }
}
