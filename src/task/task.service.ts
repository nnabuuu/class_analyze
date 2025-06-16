import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TranscriptProcessingService } from './transcript-processing.service';
import { TaskQueueService } from './task-queue.service';
import * as fs from 'node:fs';
import { TaskStage, TaskStatus } from './task.types'; // in-memory or Bull-based queue

@Injectable()
export class TaskService {
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly transcriptProcessor: TranscriptProcessingService,
    @Inject(forwardRef(() => TaskQueueService))
    private readonly taskQueue: TaskQueueService,
  ) {}

  // 👇 For structured transcript array
  async createTask(dto: CreateTaskDto): Promise<string> {
    const taskId = uuidv4();

    // Save input
    this.localStorage.saveFile(
      taskId,
      'input.json',
      JSON.stringify(dto.transcript, null, 2),
    );

    // Save initial status
    this.updateStatus(taskId, 'queued', 'awaiting_processing', 0);

    // Enqueue the task
    await this.taskQueue.enqueue({
      taskId,
      type: 'json_transcript',
    });

    return taskId;
  }

  // 👇 For raw .txt file
  async submitTxtTranscriptTask(text: string): Promise<string> {
    const taskId = uuidv4();

    this.localStorage.saveFile(taskId, 'input.txt', text);
    this.updateStatus(taskId, 'queued', 'awaiting_processing', 0);

    await this.taskQueue.enqueue({
      taskId,
      type: 'txt_transcript',
    });

    return taskId;
  }

  // ✅ Used by background worker
  async runTask(task: { taskId: string; type: string }) {
    const { taskId, type } = task;

    try {
      this.updateStatus(taskId, 'processing', 'awaiting_processing', 0.05);

      if (type === 'json_transcript') {
        const transcript = this.localStorage.readJsonSafe(taskId, 'input.json');
        await this.transcriptProcessor.runTranscriptCleaning(
          transcript,
          taskId,
        );
      } else if (type === 'txt_transcript') {
        const text = this.localStorage.readTextFileSafe(taskId, 'input.txt');
        await this.transcriptProcessor.runTranscriptCleaning(text, taskId);
      }

      this.updateStatus(taskId, 'completed', 'done', 1);
    } catch (err) {
      console.error(`❌ Task ${taskId} failed:`, err.message);
      this.localStorage.saveFile(
        taskId,
        'status.json',
        JSON.stringify(
          {
            status: 'failed',
            stage: 'error',
            progress: 1,
            message: err.message,
          },
          null,
          2,
        ),
      );
    }
  }

  private updateStatus(
    taskId: string,
    status: TaskStatus['status'],
    stage: TaskStage,
    progress: number,
    message?: string,
  ) {
    this.localStorage.saveFile(
      taskId,
      'status.json',
      JSON.stringify(
        {
          status,
          stage,
          progress,
          message,
        },
        null,
        2,
      ),
    );
  }

  getTaskStatus(taskId: string) {
    return (
      this.localStorage.readJsonSafe(taskId, 'status.json') || {
        status: 'unknown',
        stage: null,
        progress: null,
      }
    );
  }

  getTaskResult(taskId: string) {
    return this.localStorage.readJsonSafe(taskId, 'output_tasks.json');
  }

  getTaskReport(taskId: string) {
    return this.localStorage.readTextFile(taskId, 'output_tasks_report.md');
  }

  getTaskChunks(taskId: string): string[] {
    const folder = this.localStorage.getTaskFolder(taskId);
    return fs
      .readdirSync(folder)
      .filter((name) => /^chunk_\d+\.json$/.test(name))
      .sort();
  }

  getParsedChunk(taskId: string, index: number) {
    const fileName = `chunk_${index}.json`;
    return this.localStorage.readJsonSafe(taskId, fileName);
  }

  getRawChunk(taskId: string, index: number) {
    const fileName = `chunk_${index}.raw.txt`;
    return this.localStorage.readTextFile(taskId, fileName);
  }
}
