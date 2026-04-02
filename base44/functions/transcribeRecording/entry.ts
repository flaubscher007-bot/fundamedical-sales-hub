import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, context } = await req.json();

    // Check for unsupported file types
    const unsupportedExts = ['.mp4', '.m4a', '.mov', '.avi', '.mkv'];
    const lowerUrl = (file_url || '').toLowerCase();
    const isUnsupported = unsupportedExts.some(ext => lowerUrl.includes(ext));
    if (isUnsupported) {
      return Response.json({
        error: "This file format is not supported for AI transcription. Please convert to .mp3 or .wav, or upload a transcript (.txt) manually."
      }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a professional meeting transcriber and analyst for Funda Medical, a South African medico-legal company.

Context about this meeting: ${context || 'No additional context provided.'}

TASK 1 - TRANSCRIPT:
Transcribe the audio/video recording. Format it clearly with:
- Speaker labels where identifiable (Speaker 1, Speaker 2, or names if mentioned)
- Timestamps if possible
- Section headings for topic changes
- A brief summary at the end

TASK 2 - ACTION ITEMS:
Extract all action items, tasks, or follow-ups mentioned in the recording. For each:
- Describe what needs to be done (clear, concise)
- Identify who it is assigned to if mentioned (Case Administrator, Finance Clerk, BUL/Sales, or a person's name)
- Note any deadline mentioned

Return a structured JSON response with both the transcript and extracted action items.`,
      file_urls: [file_url],
      model: 'gemini_3_flash',
      response_json_schema: {
        type: "object",
        properties: {
          transcript: { type: "string", description: "Full formatted transcript" },
          summary: { type: "string", description: "Brief meeting summary (2-3 sentences)" },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                assigned_to_type: { type: "string", description: "Case Administrator, Finance Clerk, BUL, or Other" },
                assigned_to_name: { type: "string" },
                due_date_hint: { type: "string", description: "Any deadline mentioned e.g. 'end of week', '3 days'" },
              }
            }
          }
        }
      }
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});