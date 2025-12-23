import { Entity, OneToMany, Collection, Property } from '@mikro-orm/core';
import { User, UserRole } from './User';

@Entity({ discriminatorValue: 'professor' })
export class Professor extends User {
  @Property({ nullable: false })
  phone = "01000000000";

  @Property({ nullable: false })
  officeLocation = "Office 1";
  @OneToMany('Publication', 'professor')
  publications = new Collection<any>(this);

  constructor(name: string, email: string, password: string) {
    super(name, email, password, UserRole.Professor);
  }
}
