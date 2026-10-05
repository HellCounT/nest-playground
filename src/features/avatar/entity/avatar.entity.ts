import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../user/entity/user.entity.js';

@Entity()
export class Avatar {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar')
  fileName: string;

  @ManyToOne(() => User, (u) => u.avatars)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column('uuid')
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
