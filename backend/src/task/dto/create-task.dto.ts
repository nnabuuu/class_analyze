export class CreateTaskDto {
  transcript: string[];
  /** Optional list of deep analysis items to run */
  deepAnalyze?: string[];
}
