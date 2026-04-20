const EmailQueue = require('../models/EmailQueue');
const EmailOptOut = require('../models/EmailOptOut');
const { sendReviewRequest } = require('./emailService');

let isRunning = false; // ✅ prevent overlapping runs

const processQueue = async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    const jobs = await EmailQueue.find({
      sent: false,
      scheduledAt: { $lte: new Date() }
    }).limit(20);

    for (const job of jobs) {
      const optedOut = await EmailOptOut.findOne({
        shopDomain: job.shopDomain,
        customerEmail: job.customerEmail
      });

      if (optedOut) {
        // ✅ mark opted-out jobs done so they don't repeat
        job.sent = true;
        job.sentAt = new Date();
        await job.save();
        continue;
      }

      try {
        await sendReviewRequest(job);
        job.sent = true;          // ✅ only mark sent on success
        job.sentAt = new Date();
        await job.save();
      } catch (e) {
        console.error(`Email failed for ${job.customerEmail}:`, e.message);
        // job stays sent: false → retried next cycle
      }
    }
  } finally {
    isRunning = false; // ✅ always release lock
  }
};

const startEmailWorker = () => {
  setInterval(processQueue, 5 * 60 * 1000);
  console.log('✅ Email worker started (runs every 5 min)');
};

module.exports = { startEmailWorker };