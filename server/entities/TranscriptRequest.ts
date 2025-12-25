import { Entity, Property, ManyToOne, Enum, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

import { TranscriptRequestAttributeValue } from './TranscriptRequestAttributeValue';

// @Observation
// Status can be replaced with int
// ADD EAV for expandability

// @Solution
// Switch to INT and EAV for rejection responses
export enum TranscriptRequestStatus {
    PendingReview = 1,
    Approved = 2,
    Rejected = 3,
}

@Entity()
export class TranscriptRequest extends BaseEntity {
    @ManyToOne(() => User)
    student!: User;

    @Enum({ items: () => TranscriptRequestStatus })
    status: TranscriptRequestStatus;

    @Property()
    requestedAt: Date = new Date();

    @ManyToOne(() => User, { nullable: true })
    reviewedBy?: User;

    @Property({ nullable: true })
    reviewedAt?: Date;

    @OneToMany(() => TranscriptRequestAttributeValue, av => av.transcriptRequest, { cascade: [Cascade.ALL] })
    attributes = new Collection<TranscriptRequestAttributeValue>(this);

    constructor(student: User) {
        super();
        this.student = student;
        this.status = TranscriptRequestStatus.PendingReview;
    }
}

