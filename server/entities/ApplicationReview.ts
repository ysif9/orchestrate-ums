import { Entity, Property, ManyToOne, Enum, Collection, OneToMany } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Application } from "./Application";
import { User } from "./User";
import { EntityAttributeValue } from "./EntityAttributeValue";
//@Observation
//Final Decision can be switched to INT
// JSON used which is not recommended

//@Solution
// Switch to EAV and INT

/**
 * Final decision enum for application reviews.
 * Using integers for better database performance and scalability.
 */
export enum FinalDecision {
    Accepted = 1,
    Rejected = 2,
    Waitlisted = 3,
}

/**
 * Represents a staff member's review of an application.
 * Stores scoring rubric, final decision, comments, and audit information
 * (reviewer ID and timestamp) for compliance purposes.
 * Uses the EAV model for flexible scoring criteria and comments.
 */
@Entity()
export class ApplicationReview extends BaseEntity {
    @ManyToOne(() => Application)
    application!: Application;

    @ManyToOne(() => User)
    reviewer!: User;

    @Enum({ items: () => FinalDecision })
    finalDecision!: FinalDecision;

    @Property()
    reviewedAt: Date = new Date();

    @OneToMany(() => EntityAttributeValue, (eav) => eav.applicationReview, { cascade: ["all" as any] })
    attributes = new Collection<EntityAttributeValue>(this);

    constructor(application: Application, reviewer: User, finalDecision: FinalDecision) {
        super();
        this.application = application;
        this.reviewer = reviewer;
        this.finalDecision = finalDecision;
    }
}

