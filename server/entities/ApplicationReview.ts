import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Application } from "./Application";
import { User } from "./User";

/**
 * Final decision enum for application reviews.
 */
export enum FinalDecision {
    Accepted = "accepted",
    Rejected = "rejected",
    Waitlisted = "waitlisted",
}

/**
 * Represents a staff member's review of an application.
 * Stores scoring rubric, final decision, comments, and audit information
 * (reviewer ID and timestamp) for compliance purposes.
 */
@Entity()
export class ApplicationReview extends BaseEntity {
    @ManyToOne(() => Application)
    application!: Application;

    @ManyToOne(() => User)
    reviewer!: User;

    /**
     * Scoring rubric with criteria and scores.
     * Stored as JSON for flexibility in scoring criteria.
     */
    @Property({ type: 'json', nullable: true })
    scoringRubric?: Record<string, any>;

    @Enum({ items: () => FinalDecision })
    finalDecision!: FinalDecision;

    @Property({ type: 'text', nullable: true })
    comments?: string;

    @Property()
    reviewedAt: Date = new Date();

    constructor(application: Application, reviewer: User, finalDecision: FinalDecision) {
        super();
        this.application = application;
        this.reviewer = reviewer;
        this.finalDecision = finalDecision;
    }
}

