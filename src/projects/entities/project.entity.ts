import { Task } from 'src/tasks/entities/task.entity.js';
import { Workspace } from 'src/workspaces/entities/workspace.entity.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Workspace, (workSpace) => workSpace.id)
  workspace!: Workspace;

  @OneToMany(() => Task, (task) => task.id)
  tasks?: Task[];
}
