import {
  Controller,
  Post,
  Body,
  Param,
  Query,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('pipeline-task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**
   * Submit transcript as JSON array directly
   */
  @Post()
  async createFromJson(@Body() dto: CreateTaskDto) {
    const taskId = this.taskService.createTask();
    await this.taskService.processJsonTranscript(taskId, dto.transcript);
    return { taskId };
  }

  /**
   * Upload .json file that contains the transcript array
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async createFromFile(@UploadedFile() file: Express.Multer.File) {
    const transcript = JSON.parse(file.buffer.toString('utf-8'));
    const taskId = this.taskService.createTask();
    await this.taskService.processJsonTranscript(taskId, transcript);
    return { taskId };
  }

  /**
   * Upload plain text transcript (.txt)
   */
  @Post('upload-text')
  @UseInterceptors(FileInterceptor('file'))
  async createFromTxt(@UploadedFile() file: Express.Multer.File) {
    const taskId = this.taskService.createTask();
    const content = file.buffer.toString('utf-8');
    await this.taskService.processTxtTranscript(taskId, content);
    return { taskId };
  }

  /**
   * Get task status or result
   */
  @Get(':taskId')
  getTaskInfo(
    @Param('taskId') taskId: string,
    @Query('include') include: string,
  ) {
    const includes = (include || '').split(',').map((s) => s.trim());
    return this.taskService.getTaskInfo(taskId, includes);
  }
}
