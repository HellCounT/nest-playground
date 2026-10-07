import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../user/entity/user.entity.js';

@Index('idx_avatar_active_user_created_at', ['userId', 'createdAt'], {
  where: `"deletedAt IS NULL`,
})
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
