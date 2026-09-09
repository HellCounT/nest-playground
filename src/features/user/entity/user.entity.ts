import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn('uuid', { unique: true })
  id: string;

  @Column('varchar', { unique: true })
  login: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar')
  hash: string;

  @Column({ type: 'varchar', length: 1000 })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt?: Date;
}
