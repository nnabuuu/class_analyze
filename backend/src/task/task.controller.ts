import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { map } from 'rxjs/operators';
import { buildTaskResponse } from './task-response.util';
import { Response } from 'express';

function parseDeepAnalyze(input: any): string[] | undefined {
  if (!input) return undefined;
  if (Array.isArray(input)) return input.map(String);
  return String(input)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
}

@Controller('pipeline-task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // 1. Submit transcript as JSON array
  @Post()
  async create(@Body() dto: CreateTaskDto) {
    const taskId = await this.taskService.createTask(dto);
    return buildTaskResponse(taskId);
  }

  // 2. Upload transcript as a .json file
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async createFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const content = file.buffer.toString('utf-8');
    const transcript = JSON.parse(content);
    const deepAnalyze = parseDeepAnalyze(body.deepAnalyze);
    const taskId = await this.taskService.createTask({ transcript, deepAnalyze });
    return buildTaskResponse(taskId);
  }

  // 3. Upload plain .txt transcript
  @Post('upload-text')
  @UseInterceptors(FileInterceptor('file'))
  async createFromTextFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const text = file.buffer.toString('utf-8');
    const deepAnalyze = parseDeepAnalyze(body.deepAnalyze);
    const taskId = await this.taskService.submitTxtTranscriptTask(
      text,
      deepAnalyze,
    );
    return buildTaskResponse(taskId);
  }

  // 3b. Upload audio file
  @Post('upload-audio')
  @UseInterceptors(FileInterceptor('file'))
  async createFromAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const deepAnalyze = parseDeepAnalyze(body.deepAnalyze);
    const taskId = await this.taskService.submitAudioTask(
      file.buffer,
      deepAnalyze,
    );
    return buildTaskResponse(taskId);
  }

  // 4. Get status
  @Get(':taskId/status')
  getStatus(@Param('taskId') taskId: string) {
    const status = this.taskService.getTaskStatus(taskId);
    return {
      id: taskId,
      ...status,
      links: {
        self: `/pipeline-task/${taskId}`,
        result: `/pipeline-task/${taskId}/result`,
        report: `/pipeline-task/${taskId}/report`,
        chunks: `/pipeline-task/${taskId}/chunks`,
      },
    };
  }

  @Sse(':taskId/events')
  progressStream(@Param('taskId') taskId: string) {
    return this.taskService
      .watchTaskProgress(taskId)
      .pipe(map((data) => ({ data } as MessageEvent)));
  }

  @Sse(':taskId/logs')
  logStream(@Param('taskId') taskId: string) {
    return this.taskService
      .watchTaskLog(taskId)
      .pipe(map((data) => ({ data } as MessageEvent)));
  }

  // 5. Get result (structured JSON)
  @Get(':taskId/result')
  getResult(@Param('taskId') taskId: string) {
    return this.taskService.getTaskResult(taskId);
  }

  // 5b. Get detected class information
  @Get(':taskId/class-info')
  getClassInfo(@Param('taskId') taskId: string) {
    return this.taskService.getClassInfo(taskId);
  }

  // 6. Get report (rendered markdown)
  @Get(':taskId/report')
  getReport(@Param('taskId') taskId: string) {
    return this.taskService.getTaskReport(taskId);
  }

  @Get(':taskId/report.pdf')
  async getReportPdf(@Param('taskId') taskId: string, @Res() res: Response) {
    const buf = this.taskService.getReportPdf(taskId);
    res.set({ 'Content-Type': 'application/pdf' });
    res.send(buf);
  }

  @Get(':taskId/report.xlsx')
  async getReportXlsx(@Param('taskId') taskId: string, @Res() res: Response) {
    const buf = this.taskService.getReportXlsx(taskId);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    res.send(buf);
  }

  // 7. List chunks
  @Get(':taskId/chunks')
  getChunks(@Param('taskId') taskId: string) {
    return this.taskService.getTaskChunks(taskId);
  }

  // 8. Get a single chunk (parsed)
  @Get(':taskId/chunk/:index')
  getChunk(@Param('taskId') taskId: string, @Param('index') index: string) {
    return this.taskService.getParsedChunk(taskId, Number(index));
  }

  // 9. Get a raw LLM chunk response
  @Get(':taskId/chunk/:index/raw')
  getRawChunk(@Param('taskId') taskId: string, @Param('index') index: string) {
    return this.taskService.getRawChunk(taskId, Number(index));
  }

  // 10. Download all task files as a zip
  @Get(':taskId/archive')
  async getArchive(@Param('taskId') taskId: string, @Res() res: Response) {
    const archive = this.taskService.getTaskArchive(taskId);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${taskId}.zip"`,
    });
    archive.pipe(res);
    await archive.finalize();
  }

  @Post(':taskId/share')
  async createShare(
    @Param('taskId') taskId: string,
    @Body() body: any,
  ) {
    return this.taskService.createShareLink(taskId, body);
  }
}
