import { Entity, Property, ManyToOne, Enum, Collection, OneToMany } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Applicant } from "./Applicant";
import { User } from "./User";
import { EntityAttributeValue } from "./EntityAttributeValue";
//@Observation
//Assessment type can be replaced with int
//Attributes are unpredictable

// @Solution
// Switch to EAV and INT
/**
 * Attachment type enum for categorizing uploaded documents.
 * Using integers for better database performance.
 */
export enum AttachmentType {
    Transcript = 1,
    Essay = 2,
    Recommendation = 3,
    Certificate = 4,
    IdDocument = 5,
    Photo = 6,
    Other = 7,
}

/**
 * Represents a file attachment uploaded by or for an applicant.
 * Stores file metadata and the path to the file on disk.
 * Uses EAV for flexible metadata per attachment type.
 */
@Entity()
export class Attachment extends BaseEntity {
    @ManyToOne(() => Applicant, { deleteRule: 'cascade' })
    applicant!: Applicant;

    @Property()
    filename!: string;

    @Property()
    originalName!: string;

    @Property()
    mimeType!: string;

    @Property()
    size!: number;

    @Property()
    filePath!: string;

    @Enum({ items: () => AttachmentType })
    type: AttachmentType = AttachmentType.Other;

    @Property()
    uploadedAt: Date = new Date();

    @ManyToOne(() => User, { nullable: true })
    createdBy?: User;

    @OneToMany(() => EntityAttributeValue, (eav) => eav.attachment, { cascade: ["all" as any] })
    attributes = new Collection<EntityAttributeValue>(this);

    constructor(
        applicant: Applicant,
        filename: string,
        originalName: string,
        mimeType: string,
        size: number,
        filePath: string
    ) {
        super();
        this.applicant = applicant;
        this.filename = filename;
        this.originalName = originalName;
        this.mimeType = mimeType;
        this.size = size;
        this.filePath = filePath;
    }
}

