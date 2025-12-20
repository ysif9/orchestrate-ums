import { Entity, Property, Unique, OneToMany, Collection, Cascade } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import type { Attachment } from "./Attachment";
import { ApplicantAttributeValue } from "./ApplicantAttributeValue";



/**
 * Represents an applicant to the university.
 * Uses EAV model for sparse/optional fields like academic history and personal info.
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
    // changed to not null
    @Property({ nullable: false })
    phone!: string;

    @Property()
    address: string = "123 Street";

    @OneToMany(() => ApplicantAttributeValue, (eav) => eav.applicant, { cascade: [Cascade.ALL], orphanRemoval: true })
    attributes = new Collection<ApplicantAttributeValue>(this);

    @OneToMany('Attachment', 'applicant')
    attachments = new Collection<Attachment>(this);

    constructor(firstName: string, lastName: string, email: string, phone: string) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
    }
}
