import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import { TaskService } from './task.service';
import { TranscriptProcessingStageHandler } from './stage-handlers/transcript-processing.stage-handler';
import { TaskEventAnalyzeStageHandler } from './stage-handlers/task-event-analyze.stage-handler';
import { FlowRunnerService } from './stage-handlers/flow-runner.service';
import { TaskQueueService } from './task-queue.service';
import { ReportGenerationStageHandler } from './stage-handlers/report-generation.handler';
import { DeepAnalyzeStageHandler } from './stage-handlers/deep-analyze.stage-handler';
import { EchoDeepAnalyzeItem } from './deep-analyze-items/echo.item';
import { ICAPDeepAnalyzeItem } from './deep-analyze-items/icap.item';
import { BloomDeepAnalyzeItem } from './deep-analyze-items/bloom.item';
import { SyllabusMappingStageHandler } from './stage-handlers/syllabus.stage-handler';

@Module({
  imports: [LocalStorageModule],
  providers: [
    TaskQueueService,
    FlowRunnerService,
    TaskService,
    TranscriptProcessingStageHandler,
    ReportGenerationStageHandler,
    TaskEventAnalyzeStageHandler,
    DeepAnalyzeStageHandler,
    EchoDeepAnalyzeItem,
    ICAPDeepAnalyzeItem,
    BloomDeepAnalyzeItem,
    {
      provide: 'TASK_STAGE_HANDLERS',
      useFactory: (
        transcript: TranscriptProcessingStageHandler,
        report: ReportGenerationStageHandler,
        syllabus_mapping: SyllabusMappingStageHandler,
        analyze: TaskEventAnalyzeStageHandler,
        deepAnalyze: DeepAnalyzeStageHandler,
      ) => [transcript, analyze, syllabus_mapping, deepAnalyze, report],
      inject: [
        TranscriptProcessingStageHandler,
        ReportGenerationStageHandler,
        SyllabusMappingStageHandler,
        TaskEventAnalyzeStageHandler,
        DeepAnalyzeStageHandler,
      ],
    },
    {
      provide: 'DEEP_ANALYZE_ITEMS',
      useFactory: (
        echo: EchoDeepAnalyzeItem,
        icap: ICAPDeepAnalyzeItem,
        bloom: BloomDeepAnalyzeItem,
      ) => [echo, icap, bloom],
      inject: [EchoDeepAnalyzeItem, ICAPDeepAnalyzeItem, BloomDeepAnalyzeItem],
    },
  ],
  controllers: [TaskController],
})
export class TaskModule {}
