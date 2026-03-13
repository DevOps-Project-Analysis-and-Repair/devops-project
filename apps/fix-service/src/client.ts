
import OpenAI from 'openai';
import { prompt_instructions } from './prompt';



export async function fixCode(code: string) {
    console.log(process.env['OPENAI_API_KEY']);
    const client = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
    });

    const response = await client.responses.create({
        model: 'gpt-5.2',
        instructions: prompt_instructions,
        input: code,
    });

    return response.output_text;
}