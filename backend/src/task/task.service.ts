import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueueService } from './task-queue.service';
import {
  FlowRunnerService,
  FlowStep,
} from './stage-handlers/flow-runner.service';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { Observable } from 'rxjs';

@Injectable()
export class TaskService {
  constructor(
    private readonly localStorage: LocalStorageService,
    @Inject(forwardRef(() => TaskQueueService))
    private readonly taskQueue: TaskQueueService,
    private readonly flowRunner: FlowRunnerService,
  ) {}

  // ✅ For structured transcript array
  async createTask(dto: CreateTaskDto): Promise<string> {
    const taskId = uuidv4();
    this.localStorage.saveFile(
      taskId,
      'cleaned_transcript.json',
      JSON.stringify(dto.transcript, null, 2),
    );
    if (dto.deepAnalyze) {
      this.localStorage.saveFile(
        taskId,
        'config.json',
        JSON.stringify({ deepAnalyze: dto.deepAnalyze }, null, 2),
      );
    }
    this.localStorage.saveProgress(
      taskId,
      'initializing',
      0,
      'Task created',
      'queued',
    );

    const plan = this.buildStepsForTask(taskId, 'json_transcript');
    this.localStorage.saveFile(
      taskId,
      'plan.json',
      JSON.stringify(plan.map((s) => s.name), null, 2),
    );

    await this.taskQueue.enqueue({
      taskId,
      type: 'json_transcript',
    });

    return taskId;
  }

  // ✅ For raw .txt file
  async submitTxtTranscriptTask(
    text: string,
    deepAnalyze?: string[],
  ): Promise<string> {
    const taskId = uuidv4();
    this.localStorage.saveFile(taskId, 'input.txt', text);
    if (deepAnalyze) {
      this.localStorage.saveFile(
        taskId,
        'config.json',
        JSON.stringify({ deepAnalyze }, null, 2),
      );
    }
    this.localStorage.saveProgress(
      taskId,
      'initializing',
      0,
      'Task created',
      'queued',
    );

    const plan = this.buildStepsForTask(taskId, 'txt_transcript');
    this.localStorage.saveFile(
      taskId,
      'plan.json',
      JSON.stringify(plan.map((s) => s.name), null, 2),
    );

    await this.taskQueue.enqueue({
      taskId,
      type: 'txt_transcript',
    });

    return taskId;
  }

  // ✅ Used by the queue runner
  async runTask(task: { taskId: string; type: string }) {
    const { taskId, type } = task;

    try {
      this.localStorage.appendLog(taskId, `Task started: ${type}`);
      this.localStorage.saveProgress(
        taskId,
        'initializing',
        0.05,
        'Task pulled from queue',
        'processing',
      );

      const steps = this.buildStepsForTask(taskId, type);
      await this.flowRunner.run(taskId, steps);

      this.localStorage.saveProgress(
        taskId,
        'done',
        1,
        'All stages completed',
        'completed',
      );
      this.localStorage.appendLog(taskId, 'Task completed');
    } catch (err) {
      console.error(`❌ Task ${taskId} failed:`, err.message);
      this.localStorage.saveProgress(taskId, 'error', 1, err.message, 'failed');
      this.localStorage.appendLog(taskId, `Task failed: ${err.message}`);
    }
  }

  // ✅ Task execution plan by type
  buildStepsForTask(taskId: string, type: string): FlowStep[] {
    if (type === 'txt_transcript') {
      return [
        { name: 'transcript_preprocessing' },
        { name: 'task-event-analyze' },
        { name: 'syllabus_mapping' },
        { name: 'deep_analyze' },
        { name: 'report_generation' },
      ];
    }

    if (type === 'json_transcript') {
      return [
        { name: 'task-event-analyze' },
        { name: 'syllabus_mapping' },
        { name: 'deep_analyze' },
        { name: 'report_generation' },
      ];
    }

    throw new Error(`Unsupported task type: ${type}`);
  }

  // ✅ Task metadata access
  getTaskStatus(taskId: string) {
    return this.localStorage.readJsonSafe(taskId, 'progress.json');
  }

  getTaskResult(taskId: string) {
    return this.localStorage.readJsonSafe(taskId, 'task_events.json');
  }

  getClassInfo(taskId: string) {
    return this.localStorage.readJsonSafe(taskId, 'class_info.json');
  }

  getTaskPlan(taskId: string): string[] {
    return (
      this.localStorage.readJsonSafe(taskId, 'plan.json') || []
    );
  }

  getTaskReport(taskId: string) {
    return this.localStorage.readTextFile(taskId, 'tasks_report.md');
  }

  getTaskChunks(taskId: string): string[] {
    const folder = this.localStorage.getTaskFolder(taskId);
    return fs
      .readdirSync(folder)
      .filter((name) => /^chunk_\d+\.json$/.test(name))
      .sort();
  }

  getParsedChunk(taskId: string, index: number) {
    return this.localStorage.readJsonSafe(taskId, `chunk_${index}.json`);
  }

  getRawChunk(taskId: string, index: number) {
    return this.localStorage.readTextFile(taskId, `chunk_${index}.raw.txt`);
  }

  getTaskArchive(taskId: string) {
    const folder = this.localStorage.getTaskFolder(taskId);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.directory(folder, false);
    return archive;
  }

  watchTaskProgress(taskId: string): Observable<any> {
    return new Observable((subscriber) => {
      const file = this.localStorage.getProgressFilePath(taskId);

      const emit = () => {
        const data = this.getTaskStatus(taskId);
        if (data) subscriber.next(data);
      };

      emit();

      const watcher = fs.watch(file, emit);

      return () => {
        watcher.close();
      };
    });
  }

  watchTaskLog(taskId: string): Observable<string> {
    return new Observable((subscriber) => {
      const file = this.localStorage.getLogFilePath(taskId);

      if (!fs.existsSync(file)) fs.writeFileSync(file, '');

      const emit = () => {
        if (fs.existsSync(file)) {
          subscriber.next(fs.readFileSync(file, 'utf-8'));
        }
      };

      emit();

      const watcher = fs.watch(file, emit);

      return () => {
        watcher.close();
      };
    });
  }
}
