import { Entity, Property, ManyToOne, Enum, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Applicant } from "./Applicant";
import { Semester } from "./Semester";
import { Program } from "./Program";



//@Observation
// Strings that can be replaced with int
// programs need to be a new entity for scalability
// that uses EAV for scalability

// Semesters weren't mapped to semester entity
// No Default value for status
/**
 * Application status enum representing the lifecycle of an application.
 * Using integers for better database performance and scalability.
 */
export enum ApplicationStatus {
    Pending = 1,
    UnderReview = 2,
    Accepted = 3,
    Rejected = 4,
    Waitlisted = 5,
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

    @ManyToOne(() => Program)
    program!: Program;

    @ManyToOne(() => Semester, { nullable: false })
    semester!: Semester;

    @Property()
    submissionDate: Date = new Date();

    @Enum({ items: () => ApplicationStatus })
    status: ApplicationStatus;

    constructor(applicant: Applicant, program: Program, semester: Semester) {
        super();
        this.applicant = applicant;
        this.program = program;
        this.semester = semester;
        this.status = ApplicationStatus.Pending;
    }
}

