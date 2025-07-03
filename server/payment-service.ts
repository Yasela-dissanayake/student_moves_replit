import Stripe from 'stripe';
import { storage } from './storage';
import { type Payment } from '@shared/schema';

// Initialize Stripe with the API key from environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.log('Warning: STRIPE_SECRET_KEY environment variable not set', 'payment-service');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

/**
 * Create a payment intent for a one-time payment
 * @param amount Amount in the smallest currency unit (e.g., cents for USD)
 * @param currency Currency code (default: 'gbp')
 * @param metadata Additional metadata for the payment
 * @returns The created payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'gbp',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    console.log('Stripe is not initialized. Missing STRIPE_SECRET_KEY.', 'payment-service');
    return null;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      metadata,
    });
    
    console.log(`Payment intent created: ${paymentIntent.id}`, 'payment-service');
    return paymentIntent;
  } catch (error: any) {
    console.log(`Error creating payment intent: ${error.message}`, 'payment-service');
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

/**
 * Create a recurring subscription for regular payments (e.g., rent)
 * @param customerId Stripe customer ID
 * @param priceId Stripe price ID for the subscription
 * @param metadata Additional metadata for the subscription
 * @returns The created subscription
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    console.log('Stripe is not initialized. Missing STRIPE_SECRET_KEY.', 'payment-service');
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
    
    console.log(`Subscription created: ${subscription.id}`, 'payment-service');
    return subscription;
  } catch (error: any) {
    console.log(`Error creating subscription: ${error.message}`, 'payment-service');
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

/**
 * Create or get a Stripe customer for a user
 * @param userId User ID in our system
 * @param email User's email address
 * @param name User's name
 * @returns The Stripe customer ID
 */
export async function getOrCreateCustomer(
  userId: number,
  email: string,
  name: string
): Promise<string | null> {
  if (!stripe) {
    console.log('Stripe is not initialized. Missing STRIPE_SECRET_KEY.', 'payment-service');
    return null;
  }

  try {
    // Check if the user already has a Stripe customer ID
    const user = await storage.getUser(userId);
    
    if (user?.stripeCustomerId) {
      // Verify that the customer still exists in Stripe
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted) {
          return user.stripeCustomerId;
        }
      } catch (error) {
        // Customer doesn't exist anymore, create a new one
        console.log(`Stripe customer ${user.stripeCustomerId} not found, creating new one`, 'payment-service');
      }
    }
    
    // Create a new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    });
    
    // Update user record with the new customer ID
    await storage.updateUser(userId, { stripeCustomerId: customer.id });
    
    console.log(`Customer created: ${customer.id} for user ${userId}`, 'payment-service');
    return customer.id;
  } catch (error: any) {
    console.log(`Error getting/creating customer: ${error.message}`, 'payment-service');
    throw new Error(`Failed to get/create customer: ${error.message}`);
  }
}

/**
 * Update a customer's payment method
 * @param customerId Stripe customer ID
 * @param paymentMethodId Stripe payment method ID
 * @returns The updated customer
 */
export async function updateCustomerPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer | null> {
  if (!stripe) {
    console.log('Stripe is not initialized. Missing STRIPE_SECRET_KEY.', 'payment-service');
    return null;
  }

  try {
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    
    // Set as the default payment method
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    console.log(`Payment method updated for customer ${customerId}`, 'payment-service');
    return customer;
  } catch (error: any) {
    console.log(`Error updating payment method: ${error.message}`, 'payment-service');
    throw new Error(`Failed to update payment method: ${error.message}`);
  }
}

/**
 * Get a customer's payment methods
 * @param customerId Stripe customer ID
 * @returns The customer's payment methods
 */
export async function getCustomerPaymentMethods(
  customerId: string
): Promise<Stripe.ApiList<Stripe.PaymentMethod> | null> {
  if (!stripe) {
    console.log('Stripe is not initialized. Missing STRIPE_SECRET_KEY.', 'payment-service');
    return null;
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    return paymentMethods;
  } catch (error: any) {
    console.log(`Error getting payment methods: ${error.message}`, 'payment-service');
    throw new Error(`Failed to get payment methods: ${error.message}`);
  }
}

/**
 * Update a user's preferred payment method in our database
 * @param userId User ID in our system
 * @param paymentMethod Payment method information (can be a description or ID)
 * @param paymentMethodDetails Additional details about the payment method
 * @returns True if updated successfully
 */
export async function updateUserPaymentMethod(
  userId: number,
  paymentMethod: string,
  paymentMethodDetails?: Record<string, any>
): Promise<boolean> {
  try {
    await storage.updateUser(userId, { 
      paymentMethod,
      // Additional fields could be updated here if needed
    });
    
    console.log(`Payment method updated for user ${userId}`, 'payment-service');
    return true;
  } catch (error: any) {
    console.log(`Error updating user payment method: ${error.message}`, 'payment-service');
    throw new Error(`Failed to update user payment method: ${error.message}`);
  }
}

/**
 * Handle webhook events from Stripe
 * @param event The Stripe event object
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    console.log(`Processing webhook event ${event.id} of type ${event.type}`, 'payment-service');
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`, 'payment-service');
    }
  } catch (error: any) {
    console.log(`Error handling webhook event: ${error.message}`, 'payment-service');
    throw new Error(`Failed to handle webhook event: ${error.message}`);
  }
}

/**
 * Handle a successful payment intent
 * @param paymentIntent The succeeded payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const { metadata } = paymentIntent;
    const paymentId = metadata?.paymentId;
    
    if (paymentId) {
      // Update the payment status in our database
      const payment = await storage.getPayment(parseInt(paymentId));
      
      if (payment) {
        await storage.updatePaymentStatus(
          parseInt(paymentId),
          'completed',
          new Date()
        );
        
        console.log(`Payment ${paymentId} marked as completed`, 'payment-service');
      } else {
        console.log(`Payment ${paymentId} not found in database`, 'payment-service');
      }
    } else {
      console.log('No payment ID in metadata', 'payment-service');
    }
  } catch (error: any) {
    console.log(`Error handling payment intent succeeded: ${error.message}`, 'payment-service');
  }
}

/**
 * Handle a failed payment intent
 * @param paymentIntent The failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const { metadata } = paymentIntent;
    const paymentId = metadata?.paymentId;
    
    if (paymentId) {
      // Update the payment status in our database
      const payment = await storage.getPayment(parseInt(paymentId));
      
      if (payment) {
        await storage.updatePaymentStatus(
          parseInt(paymentId),
          'failed',
          undefined
        );
        
        console.log(`Payment ${paymentId} marked as failed`, 'payment-service');
      } else {
        console.log(`Payment ${paymentId} not found in database`, 'payment-service');
      }
    } else {
      console.log('No payment ID in metadata', 'payment-service');
    }
  } catch (error: any) {
    console.log(`Error handling payment intent failed: ${error.message}`, 'payment-service');
  }
}

/**
 * Handle a successful invoice payment (for subscriptions)
 * @param invoice The succeeded invoice
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    const subscriptionId = invoice.subscription as string;
    
    if (subscriptionId) {
      // Find the payment associated with this subscription
      const payments = await storage.getPaymentsByStripeSubscriptionId(subscriptionId);
      
      if (payments && payments.length > 0) {
        // Update the most recent payment
        const latestPayment = payments.reduce((latest, current) => 
          !latest || (current.createdAt && latest.createdAt && current.createdAt > latest.createdAt) 
            ? current 
            : latest
        );
        
        await storage.updatePaymentStatus(
          latestPayment.id,
          'completed',
          new Date()
        );
        
        console.log(`Payment ${latestPayment.id} for subscription ${subscriptionId} marked as completed`, 'payment-service');
      } else {
        console.log(`No payments found for subscription ${subscriptionId}`, 'payment-service');
      }
    } else {
      console.log('No subscription ID in invoice', 'payment-service');
    }
  } catch (error: any) {
    console.log(`Error handling invoice payment succeeded: ${error.message}`, 'payment-service');
  }
}

/**
 * Handle a failed invoice payment (for subscriptions)
 * @param invoice The failed invoice
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    const subscriptionId = invoice.subscription as string;
    
    if (subscriptionId) {
      // Find the payment associated with this subscription
      const payments = await storage.getPaymentsByStripeSubscriptionId(subscriptionId);
      
      if (payments && payments.length > 0) {
        // Update the most recent payment
        const latestPayment = payments.reduce((latest, current) => 
          !latest || (current.createdAt && latest.createdAt && current.createdAt > latest.createdAt) 
            ? current 
            : latest
        );
        
        await storage.updatePaymentStatus(
          latestPayment.id,
          'failed',
          undefined
        );
        
        console.log(`Payment ${latestPayment.id} for subscription ${subscriptionId} marked as failed`, 'payment-service');
      } else {
        console.log(`No payments found for subscription ${subscriptionId}`, 'payment-service');
      }
    } else {
      console.log('No subscription ID in invoice', 'payment-service');
    }
  } catch (error: any) {
    console.log(`Error handling invoice payment failed: ${error.message}`, 'payment-service');
  }
}