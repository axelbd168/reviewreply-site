const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the customer_id that was stored when they first logged in
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'Missing customer_id' });
    }

    // Create a portal session — Stripe generates a one-time link
    // to the management page you configured earlier
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: 'https://reviewreply.dev/app.html',
    });

    // Send the portal URL back so the browser can redirect there
    res.status(200).json({ url: portalSession.url });

  } catch (error) {
    console.error('Portal session error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
