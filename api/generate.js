export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from Vercel environment variables (hidden from users)
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
  }

  // Get the review and stars from the request
  const { review, stars } = req.body;

  if (!review || !stars) {
    return res.status(400).json({ error: 'Please provide a review and star rating.' });
  }

  // Limit review length to prevent abuse
  if (review.length > 2000) {
    return res.status(400).json({ error: 'Review is too long. Please keep it under 2000 characters.' });
  }

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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Write a short, professional response to this ${stars}-star Google review for a small business. Keep it under 80 words. Be genuine, not corporate. If negative: apologize, offer to fix it. If positive: thank them warmly. Write ONLY the reply text, nothing else.\n\nReview: "${review}"`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to generate reply. Please try again.' });
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.content[0].text });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
