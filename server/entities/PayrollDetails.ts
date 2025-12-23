import { Entity, OneToOne, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

export enum PaymentFrequency {
    Monthly = 0,
    Weekly = 1
}

@Entity()
export class PayrollDetails extends BaseEntity {
    @OneToOne(() => User, { owner: true })
    user!: User;

    @Property({ type: 'decimal', precision: 10, scale: 2 })
    baseSalary!: number;

    @Property({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    taxRate!: number; // Percentage, e.g., 10.00 for 10%

    @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    insuranceAmount!: number;

    @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    otherDeductions!: number;

    @Enum(() => PaymentFrequency)
    paymentFrequency: PaymentFrequency = PaymentFrequency.Monthly;

    constructor(user: User, baseSalary: number) {
        super();
        this.user = user;
        this.baseSalary = baseSalary;
    }
}
