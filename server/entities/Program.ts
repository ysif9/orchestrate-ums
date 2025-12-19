import { Entity, Property, OneToMany, Collection, ManyToOne } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity";
import { EntityAttributeValue } from "./EntityAttributeValue";
import { Department } from "./Department";

/**
 * Represents an academic program (e.g., Computer Science, Electrical Engineering).
 * Uses the EAV model for flexible attributes.
 */
@Entity()
export class Program extends BaseEntity {
    @Property({ unique: true })
    name!: string;

    @Property({ nullable: true })
    description?: string;

    @ManyToOne(() => Department, { nullable: true })
    department?: Department;

    @OneToMany(() => EntityAttributeValue, (eav) => eav.program, { cascade: ["all" as any] })
    attributes = new Collection<EntityAttributeValue>(this);

    constructor(name: string) {
        super();
        this.name = name;
    }
}
