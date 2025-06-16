import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { TaskStage } from '../task/task.types';

@Injectable()
export class LocalStorageService {
  private basePath = path.join(os.homedir(), '.kedge-tech');

  getTaskFolder(taskId: string): string {
    const taskPath = path.join(this.basePath, 'tasks', taskId);
    if (!fs.existsSync(taskPath)) fs.mkdirSync(taskPath, { recursive: true });
    return taskPath;
  }

  saveFile(taskId: string, fileName: string, content: string): string {
    const taskPath = this.getTaskFolder(taskId);
    const fullPath = path.join(taskPath, fileName);
    fs.writeFileSync(fullPath, content, 'utf-8');
    return fullPath;
  }

  readTextFile(taskId: string, fileName: string): string {
    const filePath = path.join(this.getTaskFolder(taskId), fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ File not found: ${filePath}`);
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  readTextFileSafe(taskId: string, fileName: string): string | null {
    try {
      const filePath = path.join(this.getTaskFolder(taskId), fileName);
      if (!fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  readJson(taskId: string, fileName: string): any {
    const taskPath = this.getTaskFolder(taskId);
    return JSON.parse(fs.readFileSync(path.join(taskPath, fileName), 'utf-8'));
  }

  readJsonSafe(taskId: string, fileName: string): any | null {
    try {
      const filePath = path.join(this.getTaskFolder(taskId), fileName);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(
        `⚠️ Failed to read JSON file ${fileName} for task ${taskId}:`,
        error.message,
      );
      return null;
    }
  }

  getProgressFilePath(taskId: string): string {
    return path.join(this.getTaskFolder(taskId), 'progress.json');
  }

  saveProgress(
    taskId: string,
    stage: TaskStage,
    progress?: number,
    message?: string,
    status:
      | 'created'
      | 'queued'
      | 'processing'
      | 'completed'
      | 'failed' = 'processing',
  ): void {
    const file = this.getProgressFilePath(taskId);

    const data = {
      taskId,
      status,
      stage,
      progress,
      message,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  }
}
