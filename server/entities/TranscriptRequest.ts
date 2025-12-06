import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

export enum TranscriptRequestStatus {
    PendingReview = "pending_review",
    Approved = "approved",
    Rejected = "rejected",
}

@Entity()
export class TranscriptRequest extends BaseEntity {
    @ManyToOne(() => User)
    student!: User;

    @Enum({ items: () => TranscriptRequestStatus })
    status: TranscriptRequestStatus = TranscriptRequestStatus.PendingReview;

    @Property()
    requestedAt: Date = new Date();

    @ManyToOne(() => User, { nullable: true })
    reviewedBy?: User;

    @Property({ nullable: true })
    reviewedAt?: Date;

    @Property({ nullable: true })
    rejectionReason?: string;

    constructor(student: User) {
        super();
        this.student = student;
    }
}

