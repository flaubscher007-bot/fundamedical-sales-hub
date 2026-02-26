import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, context } = await req.json();

    const transcript = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a professional meeting transcriber. Please transcribe the audio/video recording provided and produce a clean, well-formatted meeting transcript.
      
Context about this meeting: ${context || 'No additional context provided.'}

Instructions:
- Format the transcript clearly with speaker labels if identifiable (e.g. "Speaker 1:", "Attendee:")
- Include timestamps if possible
- Separate topics/sections with headings
- At the end, add a brief summary of key discussion points
- If you cannot transcribe the audio, summarize what you can observe from the file

Return the full transcript.`,
      file_urls: [file_url]
    });

    return Response.json({ success: true, transcript });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});