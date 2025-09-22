const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const logger = require('../config/logger');
const config = require('../config');

// Configure PayPal
paypal.configure({
  mode: config.paypal.mode,
  client_id: config.paypal.clientId,
  client_secret: config.paypal.clientSecret
});

class PaymentService {
  /**
   * Process payment
   */
  async processPayment(paymentData) {
    try {
      const { method, amount, currency, orderId, customerId } = paymentData;

      switch (method) {
        case 'stripe':
          return await this.processStripePayment(paymentData);
        case 'paypal':
          return await this.processPayPalPayment(paymentData);
        case 'bank_transfer':
          return await this.processBankTransfer(paymentData);
        case 'cash_on_delivery':
          return await this.processCashOnDelivery(paymentData);
        case 'cryptocurrency':
          return await this.processCryptoPayment(paymentData);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      logger.error('Process payment error:', error);
      throw error;
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(paymentData) {
    try {
      const { amount, currency, paymentMethodId, customerId, orderId } = paymentData;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        customer: customerId,
        metadata: {
          orderId: orderId.toString()
        },
        confirm: true,
        return_url: `${config.cors.origin}/payment/return`
      });

      logger.info('Stripe payment processed', { 
        paymentIntentId: paymentIntent.id, 
        orderId, 
        amount 
      });

      return {
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        transactionId: paymentIntent.id,
        gatewayResponse: paymentIntent,
        amount: amount,
        currency: currency
      };
    } catch (error) {
      logger.error('Stripe payment error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(paymentData) {
    try {
      const { amount, currency, orderId, returnUrl, cancelUrl } = paymentData;

      const payment = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        transactions: [{
          amount: {
            total: amount.toFixed(2),
            currency: currency.toUpperCase()
          },
          description: `Order #${orderId}`,
          custom: orderId.toString()
        }],
        redirect_urls: {
          return_url: returnUrl || `${config.cors.origin}/payment/return`,
          cancel_url: cancelUrl || `${config.cors.origin}/payment/cancel`
        }
      };

      return new Promise((resolve, reject) => {
        paypal.payment.create(payment, (error, payment) => {
          if (error) {
            logger.error('PayPal payment error:', error);
            reject(new Error(`PayPal payment failed: ${error.message}`));
          } else {
            logger.info('PayPal payment created', { 
              paymentId: payment.id, 
              orderId 
            });
            
            resolve({
              status: 'pending',
              transactionId: payment.id,
              gatewayResponse: payment,
              amount: amount,
              currency: currency,
              approvalUrl: payment.links.find(link => link.rel === 'approval_url')?.href
            });
          }
        });
      });
    } catch (error) {
      logger.error('PayPal payment error:', error);
      throw error;
    }
  }

  /**
   * Execute PayPal payment
   */
  async executePayPalPayment(paymentId, payerId) {
    try {
      return new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, { payer_id: payerId }, (error, payment) => {
          if (error) {
            logger.error('PayPal payment execution error:', error);
            reject(new Error(`PayPal payment execution failed: ${error.message}`));
          } else {
            logger.info('PayPal payment executed', { paymentId });
            
            resolve({
              status: payment.state === 'approved' ? 'completed' : 'failed',
              transactionId: payment.id,
              gatewayResponse: payment,
              amount: parseFloat(payment.transactions[0].amount.total),
              currency: payment.transactions[0].amount.currency
            });
          }
        });
      });
    } catch (error) {
      logger.error('PayPal payment execution error:', error);
      throw error;
    }
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransfer(paymentData) {
    try {
      const { amount, currency, orderId, bankDetails } = paymentData;

      // Generate bank transfer reference
      const reference = `BT-${orderId}-${Date.now()}`;

      logger.info('Bank transfer payment initiated', { 
        reference, 
        orderId, 
        amount 
      });

      return {
        status: 'pending',
        transactionId: reference,
        gatewayResponse: {
          reference,
          bankDetails,
          instructions: 'Please transfer the amount to the provided bank account'
        },
        amount: amount,
        currency: currency
      };
    } catch (error) {
      logger.error('Bank transfer payment error:', error);
      throw error;
    }
  }

  /**
   * Process cash on delivery payment
   */
  async processCashOnDelivery(paymentData) {
    try {
      const { amount, currency, orderId } = paymentData;

      logger.info('Cash on delivery payment initiated', { 
        orderId, 
        amount 
      });

      return {
        status: 'pending',
        transactionId: `COD-${orderId}-${Date.now()}`,
        gatewayResponse: {
          method: 'cash_on_delivery',
          instructions: 'Payment will be collected upon delivery'
        },
        amount: amount,
        currency: currency
      };
    } catch (error) {
      logger.error('Cash on delivery payment error:', error);
      throw error;
    }
  }

  /**
   * Process cryptocurrency payment
   */
  async processCryptoPayment(paymentData) {
    try {
      const { amount, currency, orderId, cryptoType = 'bitcoin' } = paymentData;

      // Generate crypto payment address
      const address = this.generateCryptoAddress(cryptoType);
      const reference = `CRYPTO-${orderId}-${Date.now()}`;

      logger.info('Cryptocurrency payment initiated', { 
        reference, 
        orderId, 
        amount, 
        cryptoType 
      });

      return {
        status: 'pending',
        transactionId: reference,
        gatewayResponse: {
          address,
          cryptoType,
          amount: amount,
          instructions: `Send ${amount} ${cryptoType} to ${address}`
        },
        amount: amount,
        currency: currency
      };
    } catch (error) {
      logger.error('Cryptocurrency payment error:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundData) {
    try {
      const { orderId, amount, reason, transactionId, method } = refundData;

      switch (method) {
        case 'stripe':
          return await this.processStripeRefund(refundData);
        case 'paypal':
          return await this.processPayPalRefund(refundData);
        default:
          return await this.processManualRefund(refundData);
      }
    } catch (error) {
      logger.error('Process refund error:', error);
      throw error;
    }
  }

  /**
   * Process Stripe refund
   */
  async processStripeRefund(refundData) {
    try {
      const { transactionId, amount, reason } = refundData;

      const refund = await stripe.refunds.create({
        payment_intent: transactionId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason || 'requested_by_customer',
        metadata: {
          orderId: refundData.orderId.toString()
        }
      });

      logger.info('Stripe refund processed', { 
        refundId: refund.id, 
        orderId: refundData.orderId, 
        amount 
      });

      return {
        status: refund.status === 'succeeded' ? 'completed' : 'failed',
        refundId: refund.id,
        amount: refund.amount / 100,
        gatewayResponse: refund
      };
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  /**
   * Process PayPal refund
   */
  async processPayPalRefund(refundData) {
    try {
      const { transactionId, amount, reason } = refundData;

      const refund = {
        amount: {
          total: amount.toFixed(2),
          currency: 'USD' // Should be dynamic
        },
        description: reason || 'Refund for order'
      };

      return new Promise((resolve, reject) => {
        paypal.sale.refund(transactionId, refund, (error, refund) => {
          if (error) {
            logger.error('PayPal refund error:', error);
            reject(new Error(`PayPal refund failed: ${error.message}`));
          } else {
            logger.info('PayPal refund processed', { 
              refundId: refund.id, 
              orderId: refundData.orderId 
            });
            
            resolve({
              status: refund.state === 'completed' ? 'completed' : 'failed',
              refundId: refund.id,
              amount: amount,
              gatewayResponse: refund
            });
          }
        });
      });
    } catch (error) {
      logger.error('PayPal refund error:', error);
      throw error;
    }
  }

  /**
   * Process manual refund
   */
  async processManualRefund(refundData) {
    try {
      const { orderId, amount, reason } = refundData;

      logger.info('Manual refund processed', { 
        orderId, 
        amount, 
        reason 
      });

      return {
        status: 'completed',
        refundId: `MANUAL-${orderId}-${Date.now()}`,
        amount: amount,
        gatewayResponse: {
          method: 'manual',
          reason: reason
        }
      };
    } catch (error) {
      logger.error('Manual refund error:', error);
      throw error;
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(transactionId, method) {
    try {
      switch (method) {
        case 'stripe':
          return await this.verifyStripePayment(transactionId);
        case 'paypal':
          return await this.verifyPayPalPayment(transactionId);
        default:
          return { status: 'unknown', verified: false };
      }
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw error;
    }
  }

  /**
   * Verify Stripe payment
   */
  async verifyStripePayment(transactionId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
      
      return {
        status: paymentIntent.status,
        verified: paymentIntent.status === 'succeeded',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        gatewayResponse: paymentIntent
      };
    } catch (error) {
      logger.error('Verify Stripe payment error:', error);
      throw error;
    }
  }

  /**
   * Verify PayPal payment
   */
  async verifyPayPalPayment(transactionId) {
    try {
      return new Promise((resolve, reject) => {
        paypal.payment.get(transactionId, (error, payment) => {
          if (error) {
            logger.error('Verify PayPal payment error:', error);
            reject(new Error(`PayPal payment verification failed: ${error.message}`));
          } else {
            resolve({
              status: payment.state,
              verified: payment.state === 'approved',
              amount: parseFloat(payment.transactions[0].amount.total),
              currency: payment.transactions[0].amount.currency,
              gatewayResponse: payment
            });
          }
        });
      });
    } catch (error) {
      logger.error('Verify PayPal payment error:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods() {
    try {
      return {
        stripe: {
          enabled: !!config.stripe.secretKey,
          methods: ['card', 'bank_transfer']
        },
        paypal: {
          enabled: !!config.paypal.clientId,
          methods: ['paypal']
        },
        bank_transfer: {
          enabled: true,
          methods: ['bank_transfer']
        },
        cash_on_delivery: {
          enabled: true,
          methods: ['cash_on_delivery']
        },
        cryptocurrency: {
          enabled: true,
          methods: ['bitcoin', 'ethereum', 'litecoin']
        }
      };
    } catch (error) {
      logger.error('Get payment methods error:', error);
      throw error;
    }
  }

  /**
   * Generate crypto address
   */
  generateCryptoAddress(cryptoType) {
    // This is a simplified implementation
    // In production, you would integrate with actual crypto wallet services
    const prefixes = {
      bitcoin: '1',
      ethereum: '0x',
      litecoin: 'L'
    };
    
    const prefix = prefixes[cryptoType] || '0x';
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    
    return prefix + randomString;
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(filters = {}) {
    try {
      const { fromDate, toDate, method } = filters;
      
      // This would typically query your database for payment records
      // For now, returning mock data
      return {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        averageTransactionValue: 0,
        paymentMethods: {
          stripe: { count: 0, amount: 0 },
          paypal: { count: 0, amount: 0 },
          bank_transfer: { count: 0, amount: 0 },
          cash_on_delivery: { count: 0, amount: 0 },
          cryptocurrency: { count: 0, amount: 0 }
        }
      };
    } catch (error) {
      logger.error('Get payment analytics error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
