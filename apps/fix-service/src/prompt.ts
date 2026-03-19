
export const PROMPT_INSTRUCTIONS = `
The input is a code file and metrics about this code file. 
Your goal is to improve the software quality of this code. 
Modify the input code snippet. Try to keep the same level of indenting as the original code.
IT IS CRUCIAL THAT YOU ONLY FIX THE ISSUES INDICATED BY THE ANALYSIS REPORT.
Do *NOT* fix any issues that are not identified in the analysis.
Return the code snippet as a string in your response in markdown format \`\`\`[language] \`\`\`\`.
`;
