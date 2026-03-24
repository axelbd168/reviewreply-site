const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session_id from the URL (e.g., /api/verify-session?session_id=cs_test_abc123)
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    // Ask Stripe: "Is this checkout session real and paid?"
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Check if the payment actually went through
    if (session.payment_status === 'paid') {
      return res.status(200).json({
        valid: true,
        customer_id: session.customer,
        customer_email: session.customer_details?.email || null,
        subscription_id: session.subscription,
      });
    } else {
      return res.status(200).json({ valid: false });
    }

  } catch (error) {
    console.error('Session verification error:', error.message);
    return res.status(400).json({ valid: false, error: 'Invalid session' });
  }
};
