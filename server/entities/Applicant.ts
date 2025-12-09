import { Entity, Property, Unique, OneToMany, Collection } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import type { Attachment } from "./Attachment";

/**
 * Represents an applicant to the university.
 * Contains personal information and embedded application data fields
 * (academicHistory, personalInfo, documents) that were originally planned
 * as a separate ApplicantData entity.
 */
@Entity()
export class Applicant extends BaseEntity {
    // Personal Information
    @Property()
    firstName!: string;

    @Property()
    lastName!: string;

    @Property()
    @Unique()
    email!: string;

    @Property({ nullable: true })
    phone?: string;

    @Property({ nullable: true })
    address?: string;

    /**
     * Academic history including previous education, GPA, transcripts, etc.
     * Stored as JSON for flexibility in data structure.
     */
    @Property({ type: 'json', nullable: true })
    academicHistory?: Record<string, any>;

    /**
     * Additional personal information beyond basic contact details.
     * May include demographics, emergency contacts, etc.
     * Stored as JSON for flexibility in data structure.
     */
    @Property({ type: 'json', nullable: true })
    personalInfo?: Record<string, any>;

    /**
     * Document references and metadata for uploaded documents.
     * May include essays, recommendations, certificates, etc.
     * Stored as JSON for flexibility in data structure.
     */
    @Property({ type: 'json', nullable: true })
    documents?: Record<string, any>;

    /**
     * File attachments uploaded by or for this applicant.
     * Includes transcripts, essays, recommendations, certificates, etc.
     */
    @OneToMany('Attachment', 'applicant')
    attachments = new Collection<Attachment>(this);

    constructor(firstName: string, lastName: string, email: string) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }
}