import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReportsService } from '../reports/reports.service';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

interface ReportContextRow {
  member: string;
  project: string;
  week: string;
  status: string;
  tasksCompleted: string[];
  blockers: string[];
  achievements: string[];
}

@Injectable()
export class AssistantService {
  private client: GoogleGenerativeAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly reportsService: ReportsService,
  ) {}

  // Lazy-initialized so a missing GEMINI_API_KEY only breaks this optional
  // feature at request time — it must never prevent the whole API from
  // booting, since every other feature works fine without it.
  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = this.config.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'AI assistant is not configured (missing GEMINI_API_KEY)',
        );
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  async ask(question: string, manager: CurrentUserPayload) {
    // Pull the last ~4 weeks of reports across the whole team as context.
    // This is a lightweight RAG approach: no vector search, just a bounded,
    // recent window of real data — appropriate for a team this size.
    const { data: reports } = await this.reportsService.findAll(manager, {
      limit: 200,
    });

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recent = reports.filter((r) => new Date(r.weekStart) >= fourWeeksAgo);

    // Build a compact, privacy-conscious context: no raw report IDs or emails,
    // just names, weeks, statuses, and the content sections needed to answer.
    const context: ReportContextRow[] = recent.map((r) => {
      const owner = r.owner as unknown as { name?: string };
      const project = r.project as unknown as { name?: string };
      return {
        member: owner.name ?? 'Unknown',
        project: project.name ?? 'Unknown',
        week: new Date(r.weekStart).toISOString().slice(0, 10),
        status: r.status,
        tasksCompleted: r.content.tasksCompleted.map((t) => t.taskName),
        blockers: r.content.blockers.map((b) => b.text),
        achievements: r.content.achievements.map((a) => a.text),
      };
    });

    const systemInstruction = `You are an assistant for a team manager reviewing weekly work reports.
Answer questions using ONLY the report data provided below. If the data doesn't
contain the answer, say so clearly rather than guessing. Be concise.

Report data (last 4 weeks):
${JSON.stringify(context, null, 2)}`;

    const model = this.getClient().getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction,
    });

    const result = await model.generateContent(question);
    return { answer: result.response.text() || 'No response generated.' };
  }
}
