import { User } from 'src/users/entities/user.entities.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkspaceMembers } from './workspace-member.entity.js';
import { Project } from 'src/projects/entities/project.entity.js';
import type { Relation } from 'typeorm';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.workspaces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: Relation<User>;

  @OneToMany(
    () => WorkspaceMembers,
    (workspaceMembers) => workspaceMembers.workspace,
  )
  workspaceMembers?: Relation<WorkspaceMembers[]>;

  @OneToMany(() => Project, (project) => project.workspace)
  projects?: Relation<Project[]>;
}
