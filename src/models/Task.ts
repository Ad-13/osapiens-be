import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Workflow } from './Workflow';
import { TaskStatus, TaskType } from '../enums';

@Entity({ name: 'tasks' })
export class Task {
    @PrimaryGeneratedColumn('uuid')
    taskId!: string;

    @Column()
    clientId!: string;

    @Column('text')
    geoJson!: string;

    @Column()
    status!: TaskStatus;

    @Column({ nullable: true, type: 'text' })
    progress?: string | null;

    @Column({ nullable: true })
    resultId?: string;

    @Column({ nullable: true, type: 'text' })
    output?: string;

    @Column({ nullable: true, type: 'text' })
    errorMessage?: string | null;

    @Column()
    taskType!: TaskType;

    @Column({ default: 1 })
    stepNumber!: number;

    @ManyToOne(() => Task, { nullable: true })
    dependsOn?: Task | null;

    @ManyToOne(() => Workflow, workflow => workflow.tasks)
    workflow!: Workflow;
}