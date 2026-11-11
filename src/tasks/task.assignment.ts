// post/notifications.processor.ts
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('task-assignment')
export class TaskAssignmentProcessor extends WorkerHost {
  process(job: Job<{ taskId: string }>): any {
    switch (job.name) {
      case 'notify-subscriber':
        console.log(
          `🔔 Processing background job: notified subscribers for task ID -> ${job.data.taskId}`,
        );
        throw new Error('Manually failing this job');
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.log({
      jobId: job.id,
      name: job.name,
      message: error.message,
    });
  }
}
