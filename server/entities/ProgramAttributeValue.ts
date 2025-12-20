import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseAttributeValue } from './BaseAttributeValue';
import { Program } from './Program';

@Entity()
export class ProgramAttributeValue extends BaseAttributeValue {
    @ManyToOne(() => Program)
    program!: Program;

    constructor(program: Program) {
        super();
        this.program = program;
    }
}
