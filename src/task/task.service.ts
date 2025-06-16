import { Injectable } from '@nestjs/common';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ConfigService } from '@nestjs/config';
import { TranscriptProcessingService } from './transcript-processing.service';
import { ChunkingService } from './chunking.service';
import { ReportService } from '../report/report.service';
import { FlowRunnerService, FlowStep } from './flow-runner.service';
import { TaskProgress } from './task-progress.enum';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface TaskMeta {
  taskId: string;
  progress: TaskProgress;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TaskService {
  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly config: ConfigService,
    private readonly transcriptProcessing: TranscriptProcessingService,
    private readonly chunkingService: ChunkingService,
    private readonly reportService: ReportService,
    private readonly flowRunner: FlowRunnerService,
  ) {}

  createTask(): string {
    const taskId = uuidv4();
    this.localStorage.getTaskFolder(taskId);
    this.localStorage.saveProgress(taskId, TaskProgress.Created);
    return taskId;
  }

  updateProgress(taskId: string, progress: TaskProgress) {
    this.localStorage.saveProgress(taskId, progress);
  }

  getTaskStatus(taskId: string): TaskMeta | null {
    return this.localStorage.readProgress(taskId);
  }

  async processTxtTranscript(taskId: string, txtContent: string) {
    // Save transcript.txt first
    this.localStorage.saveFile(taskId, 'transcript.txt', txtContent);

    // Define the flow
    const steps: FlowStep[] = [
      {
        name: TaskProgress.TxtParsed,
        handler: async () => {
          const cleaned = await this.transcriptProcessing.runTranscriptCleaning(
            taskId,
            txtContent,
          );
          this.localStorage.saveFile(
            taskId,
            'output.json',
            JSON.stringify(cleaned, null, 2),
          );
        },
      },
      {
        name: TaskProgress.Chunked,
        handler: async () => {
          const cleanedJson = this.localStorage.readJson(taskId, 'output.json');
          await this.chunkingService.process(taskId, cleanedJson);
        },
      },
      {
        name: TaskProgress.ReportGenerated,
        handler: async () => {
          this.reportService.generateReport(taskId);
        },
      },
    ];

    // Run the pipeline
    await this.flowRunner.run(taskId, steps);
  }

  async processJsonTranscript(taskId: string, transcript: any[]) {
    this.localStorage.saveFile(
      taskId,
      'output.json',
      JSON.stringify(transcript, null, 2),
    );
    await this.flowRunner.run(taskId, [
      {
        name: TaskProgress.Chunked,
        handler: async () => {
          await this.chunkingService.process(taskId, transcript);
        },
      },
      {
        name: TaskProgress.ReportGenerated,
        handler: async () => {
          this.reportService.generateReport(taskId);
        },
      },
    ]);
  }

  async getTaskInfo(taskId: string, includes: string[]) {
    const data: any = { taskId };

    if (includes.includes('status')) {
      data.status = this.localStorage.readProgress(taskId);
    }

    if (includes.includes('result')) {
      data.result = this.localStorage.readJsonSafe(taskId, 'output_tasks.json');
    }

    if (includes.includes('files')) {
      const folder = this.localStorage.getTaskFolder(taskId);
      data.files = fs.readdirSync(folder).filter((f) => !f.startsWith('.'));
    }

    return data;
  }
}
