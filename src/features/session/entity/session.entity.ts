import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../user/entity/user.entity.js';

@Entity()
export class Session {
  @PrimaryColumn('uuid', { unique: true })
  id: string;

  @ManyToOne(() => User, (u) => u.sessions)
  @JoinColumn()
  user: Relation<User>;

  @Column('varchar')
  userId: string;

  @Column('varchar')
  ip: string;

  @Column('varchar')
  deviceName: string;

  @Column('varchar')
  refreshTokenCreationDate: string;

  @Column('timestamp')
  lastVisit: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
