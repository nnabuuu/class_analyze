import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import { TaskService } from './task.service';
import { TranscriptProcessingStageHandler } from './stage-handlers/transcript-processing.stage-handler';
import { TaskEventAnalyzeStageHandler } from './stage-handlers/task-event-analyze.stage-handler';
import { FlowRunnerService } from './stage-handlers/flow-runner.service';
import { TaskQueueService } from './task-queue.service';
import { ReportGenerationStageHandler } from './stage-handlers/report-generation.handler';

@Module({
  imports: [LocalStorageModule],
  providers: [
    TaskQueueService,
    FlowRunnerService,
    TaskService,
    {
      provide: 'TASK_STAGE_HANDLERS',
      useExisting: TranscriptProcessingStageHandler,
    },
    {
      provide: 'TASK_STAGE_HANDLERS',
      useExisting: ReportGenerationStageHandler,
    },
    {
      provide: 'TASK_STAGE_HANDLERS',
      useExisting: TaskEventAnalyzeStageHandler,
    },
  ],
  controllers: [TaskController],
})
export class TaskModule {}
