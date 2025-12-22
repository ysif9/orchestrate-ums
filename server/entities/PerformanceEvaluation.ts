import { Entity, ManyToOne, Property, JsonType } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

@Entity()
export class PerformanceEvaluation extends BaseEntity {
    @ManyToOne(() => User)
    evaluator!: User; // Staff member who created the evaluation

    @ManyToOne(() => User)
    evaluatee!: User; // Professor or TA being evaluated

    @Property()
    date!: Date;

    @Property({ type: JsonType, nullable: true })
    ratings?: Record<string, number>; // e.g., { "teaching": 5, "research": 4 }

    @Property({ type: 'text', nullable: true })
    comments?: string;

    constructor(
        evaluator: User,
        evaluatee: User,
        date: Date,
        ratings?: Record<string, number>,
        comments?: string
    ) {
        super();
        this.evaluator = evaluator;
        this.evaluatee = evaluatee;
        this.date = date;
        this.ratings = ratings;
        this.comments = comments;
    }
}
