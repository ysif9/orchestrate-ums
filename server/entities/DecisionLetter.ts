import { Entity, Property, ManyToOne } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { Application } from "./Application";
import { User } from "./User";





/**
 * Represents a generated decision letter for an application.
 * Stores the letter content, generation timestamp, and the user who generated it.
 */
@Entity()
export class DecisionLetter extends BaseEntity {
    @ManyToOne(() => Application)
    application!: Application;

    @Property({ type: 'text' })
    content!: string;

    @Property()
    generatedAt: Date = new Date();

    @ManyToOne(() => User)
    generatedBy!: User;

    constructor(application: Application, content: string, generatedBy: User) {
        super();
        this.application = application;
        this.content = content;
        this.generatedBy = generatedBy;
    }
}

