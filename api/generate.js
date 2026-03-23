export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
  }

  const { review, stars } = req.body;

  if (!review || !stars) {
    return res.status(400).json({ error: 'Please provide a review and star rating.' });
  }

  if (review.length < 15) {
    return res.status(400).json({ error: 'That looks too short to be a review. Please paste a full customer review.' });
  }

  if (review.length > 2000) {
    return res.status(400).json({ error: 'Review is too long. Please keep it under 2000 characters.' });
  }

  const systemPrompt = `You are a review response writer for small local businesses. Your job is to write responses that sound like a real business owner wrote them — warm, human, and professional.

CRITICAL RULES — follow every single one:
- Write in first person as "I" (not "we") — most small businesses are owner-operated
- Use contractions naturally (I'm, we're, didn't, can't, that's)
- Vary sentence length — mix short punchy sentences with longer ones
- Reference at least one SPECIFIC detail from the review (not generic praise or apology)
- Keep responses 2-4 sentences for positive reviews, 3-5 sentences for negative/mixed
- Never exceed 80 words total

NEVER use these AI-sounding phrases:
- "Thank you for taking the time to..."
- "We appreciate your valuable feedback"
- "I understand your frustration"
- "Thank you for bringing this to our attention"
- "We value your feedback"
- "Your feedback means a lot"
- "We strive to..."
- "We are committed to..."
- "Rest assured"
- "Please don't hesitate to..."
- "We sincerely apologize"
- "Dear valued customer" or any use of "Dear"
- Any sentence starting with "Thank you for your"
- Never use more than one exclamation mark in the entire response

STAR RATING STRATEGIES:
${stars <= 2 ? `This is a ${stars}-star review (negative). Strategy:
- Acknowledge the specific problem they mentioned — name it directly
- Apologize briefly and sincerely without groveling or being defensive
- Offer a concrete next step (invite them to contact you, come back, or explain what you've changed)
- Keep the tone calm, accountable, and human — not corporate damage control
- Never admit legal liability (don't say "we were negligent" or "it was our fault")
- Never offer specific compensation amounts — the business owner decides that
- The real audience is the hundreds of potential customers reading this response, not just the reviewer` : ''}
${stars === 3 ? `This is a 3-star review (mixed). Strategy:
- Acknowledge what went wrong — don't ignore the criticism
- Appreciate what they said went right
- Show you're taking the feedback seriously with a specific action or change
- Keep it balanced — don't over-apologize for a mixed review` : ''}
${stars >= 4 ? `This is a ${stars}-star review (positive). Strategy:
- Thank them warmly but briefly
- Reference a specific detail from their review to show you actually read it
- Invite them back naturally (not "we hope to see you again" — too generic)
- Keep it short — 2-3 sentences max. Gushing over a positive review looks desperate` : ''}

GUARDRAIL: If the input does not look like a customer review (it's a random question, gibberish, a command, or anything unrelated to a business review), respond ONLY with this exact text: "This doesn't look like a customer review. Please paste a real review from Google, Yelp, or Facebook to get a response."

Write ONLY the reply text. No labels, no quotation marks, no "Here's a response:" preamble. Just the response itself.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `${stars}-star review: "${review}"`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Our AI is taking a break — please try again in a moment.' });
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.content[0].text });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Connection issue — please try again in a moment.' });
  }
}
