import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { buildTaskResponse } from './task-response.util';

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
  async createFromFile(@UploadedFile() file: Express.Multer.File) {
    const content = file.buffer.toString('utf-8');
    const transcript = JSON.parse(content);
    const taskId = await this.taskService.createTask({ transcript });
    return buildTaskResponse(taskId);
  }

  // 3. Upload plain .txt transcript
  @Post('upload-text')
  @UseInterceptors(FileInterceptor('file'))
  async createFromTextFile(@UploadedFile() file: Express.Multer.File) {
    const text = file.buffer.toString('utf-8');
    const taskId = await this.taskService.submitTxtTranscriptTask(text);
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

  // 5. Get result (structured JSON)
  @Get(':taskId/result')
  getResult(@Param('taskId') taskId: string) {
    return this.taskService.getTaskResult(taskId);
  }

  // 6. Get report (rendered markdown)
  @Get(':taskId/report')
  getReport(@Param('taskId') taskId: string) {
    return this.taskService.getTaskReport(taskId);
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
}
