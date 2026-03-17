
import OpenAI from 'openai';
import { prompt_instructions } from './prompt';
import { SonarRepairIssue } from 'shared';

function promptInput(analysisResults: string[], code: string): string {
  const analysisInstructions = `Analysis:\n${analysisResults.join('\n')}`;
  const codeInstructions = 'Code:\n```'+ code + '```'

  return `${analysisInstructions}\n${codeInstructions}`;
}

function sonarIssuesToAnalysisResults(issues: SonarRepairIssue[]): string[] {
  return issues.map(x => `Analysis: ${x.message} at ${x.line}`);
}

export async function fixCode(code: string, sonarIssues: SonarRepairIssue[]) {
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
  });

  console.log(sonarIssues);
  console.log(code);

  const analysis = sonarIssuesToAnalysisResults(sonarIssues);

  console.log(analysis);

  const input = promptInput(analysis, code);

  console.log(input);

  const response = await client.responses.create({
    model: 'gpt-5.2',
    instructions: prompt_instructions,
    input
  });

  return response.output_text;
}
