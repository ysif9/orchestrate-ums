import { Entity, Property, ManyToOne, Enum, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Applicant } from "./Applicant";

/**
 * Application status enum representing the lifecycle of an application.
 */
export enum ApplicationStatus {
    Pending = "pending",
    UnderReview = "under_review",
    Accepted = "accepted",
    Rejected = "rejected",
    Waitlisted = "waitlisted",
}

/**
 * Represents an application submitted by an applicant for a specific program.
 * Links an Applicant to their application for a particular program and semester.
 */
@Entity()
@Unique({ properties: ['applicant', 'program', 'semester'] })
export class Application extends BaseEntity {
    @ManyToOne(() => Applicant)
    applicant!: Applicant;

    @Property()
    program!: string;

    @Property({ nullable: true })
    semester?: string;

    @Property()
    submissionDate: Date = new Date();

    @Enum({ items: () => ApplicationStatus })
    status: ApplicationStatus = ApplicationStatus.Pending;

    constructor(applicant: Applicant, program: string) {
        super();
        this.applicant = applicant;
        this.program = program;
    }
}

