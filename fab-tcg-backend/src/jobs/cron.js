const cron = require('node-cron');
const livingLegendService = require('../services/livingLegendService');

/**
 * Initializes Cron Jobs for the backend.
 */
const initCronJobs = () => {
    console.log('[Cron] Initializing scheduled jobs...');

    /**
     * Living Legend Update
     * Schedule: Every Monday at 08:00 AM (Server Time)
     * Cron syntax: 0 8 * * 1
     */
    cron.schedule('0 8 * * 1', async () => {
        console.log('⏰ [Cron] Running Weekly Living Legend Update...');
        try {
            const result = await livingLegendService.updateLeaderboard();
            if (result.success) {
                console.log(`✅ [Cron] Living Legend update completed. Updated ${result.count} heroes.`);
            } else {
                console.error(`❌ [Cron] Living Legend update failed: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ [Cron] Critical error in Living Legend job:', error);
        }
    });

    console.log('[Cron] Jobs scheduled:');
    console.log('   - Living Legend Update: Every Monday at 08:00 AM');
};

module.exports = { initCronJobs };
