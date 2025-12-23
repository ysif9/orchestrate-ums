import { Entity, Property, ManyToOne, Enum, PrimaryKey, BaseEntity } from '@mikro-orm/core';
import { User } from './User';

export enum LeaveType {
    Annual = 'annual',
    Sick = 'sick',
    Emergency = 'emergency',
}

export enum LeaveStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

@Entity()
export class LeaveRequest extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User)
    applicant!: User;

    @ManyToOne(() => User, { nullable: true })
    reviewer?: User;

    @Enum(() => LeaveType)
    type!: LeaveType;

    @Property()
    startDate!: Date;

    @Property()
    endDate!: Date;

    @Property({ nullable: true })
    reason?: string;

    @Enum(() => LeaveStatus)
    status: LeaveStatus = LeaveStatus.Pending;

    @Property({ nullable: true })
    rejectionReason?: string;

    @Property()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    constructor(applicant: User, type: LeaveType, startDate: Date, endDate: Date, reason?: string) {
        super();
        this.applicant = applicant;
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
    }
}
