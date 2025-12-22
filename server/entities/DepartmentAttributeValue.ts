import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Department } from './Department';

@Entity()
export class DepartmentAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Department)
    department!: Department;

    constructor(department: Department) {
        super();
        this.department = department;
    }
}
