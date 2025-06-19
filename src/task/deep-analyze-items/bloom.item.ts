import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DeepAnalyzeItem } from '../stage-handlers/deep-analyze-item.interface';
import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TaskEventAnalyzeStageHandler } from '../stage-handlers/task-event-analyze.stage-handler';
import { extractLargestJsonBlock } from '../../utils';
import {
  TaskEventAnalyzeOutputSchema,
  BloomEventResult,
  BloomEventResultSchema,
  BloomTaskSummary,
  BloomTaskSummarySchema,
  BloomOverallSummary,
  BloomOverallSummarySchema,
  BloomAnalysis,
  BloomAnalysisSchema,
} from '../../models';

const modelName = process.env.MODEL || 'gpt-4o';
const SYSTEM_PROMPT_EVENT = `你是一位教育分析专家，依据提供的课堂片段信息，判断其主要针对的 Bloom 认知层次。只能从以下六个层次中选择：Remember、Understand、Apply、Analyze、Evaluate、Create。请严格按照以下 JSON 格式回复：\n{\n  "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",\n  "reasoning": "简要说明理由",\n  "confidence": 0.8\n}`;
const SYSTEM_PROMPT_TASK = `你是一位教育分析专家，请基于事件级 Bloom 分析结果，总结该教学任务在认知层次上的特点，并指出主要层次。`;
const SYSTEM_PROMPT_OVERALL = `你是一位教育分析专家，请基于多个教学任务的 Bloom 分析总结整堂课的认知层次分布，并给出主要层次。`;

@Injectable()
export class BloomDeepAnalyzeItem implements DeepAnalyzeItem {
  readonly name = 'bloom-taxonomy';
  readonly dependsOn = [TaskEventAnalyzeStageHandler];
  readonly outputFiles = ['bloom_taxonomy.json'];

  constructor(
    private readonly config: ConfigService,
    private readonly storage: LocalStorageService,
  ) {}

  private readonly openai = new OpenAI({
    apiKey: this.config.get('OPENAI_API_KEY'),
  });

  async analyze(taskId: string): Promise<void> {
    const tasksRaw = this.storage.readJson(taskId, 'task_events.json');
    const tasks = TaskEventAnalyzeOutputSchema.parse(tasksRaw);
    const eventResults: BloomEventResult[] = [];
    const taskSummaries: BloomTaskSummary[] = [];

    for (const task of tasks) {
      const eventsOfTask: BloomEventResult[] = [];
      for (const event of task.events || []) {
        const res = await this.analyzeEvent(event);
        if (res) {
          eventsOfTask.push(res);
          eventResults.push(res);
        }
        await this.sleep(500);
      }

      const summary = await this.summarizeTask(task.task_title, eventsOfTask);
      if (summary) taskSummaries.push(summary);
      await this.sleep(500);
    }

    const overall = await this.summarizeOverall(taskSummaries);

    const analysis: BloomAnalysis = BloomAnalysisSchema.parse({
      eventResults,
      taskSummaries,
      overall,
    });

    this.storage.saveFile(
      taskId,
      this.outputFiles[0],
      JSON.stringify(analysis, null, 2),
    );
  }

  private async analyzeEvent(event: any): Promise<BloomEventResult | null> {
    const sentences = event.sentences || [];
    if (sentences.length === 0) return null;

    const start = sentences[0].start;
    const end = sentences[sentences.length - 1].end;
    const text = event.summary || sentences.map((s: any) => s.text).join(' ');

    const userPrompt = this.buildEventPrompt(event);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_EVENT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0,
        });

        const raw = response.choices[0].message.content?.trim() || '';
        const cleaned = extractLargestJsonBlock(raw);
        if (!cleaned) throw new Error('Empty response');
        const parsed = BloomEventResultSchema.omit({
          start: true,
          end: true,
          text: true,
        }).parse(JSON.parse(cleaned));

        return BloomEventResultSchema.parse({
          start,
          end,
          text,
          bloom_level: parsed.bloom_level,
          reasoning: parsed.reasoning,
          confidence: parsed.confidence,
        });
      } catch (err) {
        if (attempt === 3) console.error('Bloom analysis failed:', err);
        await this.sleep(1000);
      }
    }

    return null;
  }

  private buildEventPrompt(event: any): string {
    const lines = (event.sentences || []).map((s: any) => {
      const speaker =
        (s.speaker_probabilities?.teacher ?? 0) >=
        (s.speaker_probabilities?.student ?? 0)
          ? '教师'
          : '学生';
      return `[${s.start}-${s.end}] ${speaker}: ${s.text}`;
    });

    return `事件类型：${event.event_type}\n事件摘要：${event.summary}\n片段内容：\n${lines.join('\n')}\n请根据以上信息判断该片段的 Bloom 认知层次，并按照要求输出 JSON。`;
  }

  private async summarizeTask(
    taskTitle: string,
    events: BloomEventResult[],
  ): Promise<BloomTaskSummary | null> {
    if (events.length === 0) return null;
    const prompt = `教学任务标题：${taskTitle}\n事件 Bloom 分析结果：\n${JSON.stringify(events, null, 2)}\n请总结该任务的主要认知层次特点并输出 JSON：\n{\n  "task_title": "",\n  "summary": "",\n  "predominant_level": "Remember|Understand|Apply|Analyze|Evaluate|Create"\n}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await this.openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_TASK },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
        });
        const raw = resp.choices[0].message.content?.trim() || '';
        const cleaned = extractLargestJsonBlock(raw);
        if (!cleaned) throw new Error('Empty response');
        const parsed = BloomTaskSummarySchema.parse(JSON.parse(cleaned));
        return parsed;
      } catch (err) {
        if (attempt === 3) console.error('Bloom task summary failed:', err);
        await this.sleep(1000);
      }
    }
    return null;
  }

  private async summarizeOverall(
    tasks: BloomTaskSummary[],
  ): Promise<BloomOverallSummary | null> {
    if (tasks.length === 0) return null;
    const prompt = `以下是各教学任务的 Bloom 总结：\n${JSON.stringify(tasks, null, 2)}\n请给出整堂课在 Bloom 认知维度上的整体评估，输出 JSON：\n{\n  "overall_summary": "",\n  "predominant_level": "Remember|Understand|Apply|Analyze|Evaluate|Create"\n}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await this.openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_OVERALL },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
        });
        const raw = resp.choices[0].message.content?.trim() || '';
        const cleaned = extractLargestJsonBlock(raw);
        if (!cleaned) throw new Error('Empty response');
        const parsed = BloomOverallSummarySchema.parse(JSON.parse(cleaned));
        return parsed;
      } catch (err) {
        if (attempt === 3) console.error('Bloom overall summary failed:', err);
        await this.sleep(1000);
      }
    }
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
