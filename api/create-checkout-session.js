const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the plan choice from the button click (either "monthly" or "yearly")
    const { plan } = req.body;

    // Map the plan choice to the correct Stripe price ID
    const priceIds = {
      monthly: 'price_1TE55mQYZ10jle1xI6KXjTVq',
      yearly: 'price_1TE56pQYZ10jle1xWgSTY0uX'
    };

    const priceId = priceIds[plan];

    // If someone sends a bad plan value, reject it
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan. Use "monthly" or "yearly".' });
    }

    // Create the Stripe Checkout session
    // This generates a unique payment page URL for this customer
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Where Stripe sends the customer AFTER successful payment
      success_url: 'https://reviewreply.dev/app.html?session_id={CHECKOUT_SESSION_ID}',
      // Where Stripe sends the customer if they click "Back" or close the page
      cancel_url: 'https://reviewreply.dev/#pricing',
      // This tells Stripe to automatically collect the customer's email
      
      // Allow promo codes if you ever want to offer discounts
      allow_promotion_codes: true,
    });

    // Send the checkout URL back to the browser so it can redirect
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
