import { RefreshToken } from 'src/auth/entities/refresh-token.entity.js';
import { UserRoles } from 'src/common/enums/user-roles.enum.js';
import { Comment } from 'src/tasks/entities/comment.entity.js';
import { Task } from 'src/tasks/entities/task.entity.js';
import { Workspace } from 'src/workspaces/entities/workspace.entity.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRoles,
    enumName: 'users_role_enum',
  })
  role!: UserRoles;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  workspaces?: Workspace[];

  @OneToMany(() => Task, (task) => task.assignee)
  task?: Task[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments?: Comment[];
}
