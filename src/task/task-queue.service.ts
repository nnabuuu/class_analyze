import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TaskService } from './task.service';

@Injectable()
export class TaskQueueService {
  private queue: any[] = [];
  private isRunning = false;

  constructor(
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
  ) {
    this.startWorker();
  }

  async enqueue(task: any) {
    this.queue.push(task);
  }

  private async startWorker() {
    if (this.isRunning) return;
    this.isRunning = true;

    while (true) {
      const task = this.queue.shift();
      if (!task) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      await this.taskService.runTask(task);
    }
  }
}
