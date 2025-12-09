import { Entity, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Applicant } from "./Applicant";
import { User } from "./User";

/**
 * Attachment type enum for categorizing uploaded documents.
 */
export enum AttachmentType {
    Transcript = "transcript",
    Essay = "essay",
    Recommendation = "recommendation",
    Certificate = "certificate",
    IdDocument = "id_document",
    Photo = "photo",
    Other = "other",
}

/**
 * Represents a file attachment uploaded by or for an applicant.
 * Stores file metadata and the path to the file on disk.
 */
@Entity()
export class Attachment extends BaseEntity {
    @ManyToOne(() => Applicant)
    applicant!: Applicant;

    /**
     * The stored filename (UUID-based or sanitized name).
     */
    @Property()
    filename!: string;

    /**
     * The original filename as uploaded by the user.
     */
    @Property()
    originalName!: string;

    /**
     * MIME type of the file (e.g., application/pdf, image/jpeg).
     */
    @Property()
    mimeType!: string;

    /**
     * File size in bytes.
     */
    @Property()
    size!: number;

    /**
     * Relative path to the file on disk (e.g., uploads/applicant-documents/uuid.pdf).
     */
    @Property()
    filePath!: string;

    /**
     * Type/category of the attachment.
     */
    @Enum({ items: () => AttachmentType })
    type: AttachmentType = AttachmentType.Other;

    /**
     * Timestamp when the file was uploaded.
     */
    @Property()
    uploadedAt: Date = new Date();

    /**
     * User who uploaded the file (could be staff or the applicant themselves).
     */
    @ManyToOne(() => User, { nullable: true })
    uploadedBy?: User;

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

