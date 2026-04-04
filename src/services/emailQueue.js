const EmailQueue = require('../models/EmailQueue');
const EmailOptOut = require('../models/EmailOptOut');
const { sendReviewRequest } = require('./emailService');

const processQueue = async () => {
  const jobs = await EmailQueue.find({ sent: false, scheduledAt: { $lte: new Date() } }).limit(20);
  for (const job of jobs) {
    const optedOut = await EmailOptOut.findOne({ shopDomain: job.shopDomain, customerEmail: job.customerEmail });
    if (!optedOut) {
      try { await sendReviewRequest(job); } catch (e) { console.error('Email error:', e.message); }
    }
    job.sent = true; job.sentAt = new Date(); await job.save();
  }
};

const startEmailWorker = () => {
  setInterval(processQueue, 5 * 60 * 1000);
  console.log('Email worker started (runs every 5 min)');
};
module.exports = { startEmailWorker };
