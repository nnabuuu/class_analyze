import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import { TaskService } from './task.service';
import { TranscriptProcessingService } from './transcript-processing.service';
import { ChunkingService } from './chunking.service';
import { ReportService } from '../report/report.service';
import { FlowRunnerService } from './flow-runner.service';

@Module({
  imports: [LocalStorageModule],
  providers: [
    FlowRunnerService,
    ChunkingService,
    TaskService,
    TranscriptProcessingService,
    ReportService,
  ],
  controllers: [TaskController],
})
export class TaskModule {}
