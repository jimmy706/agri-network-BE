import logger from "@shared/Logger";

const cron = require('node-cron');

const { SCHEDULE_MINUTE, SCHEDULE_HOUR, SCHEDULE_DOM, SCHEDULE_MONTH, SCHEDULE_DOW } = process.env;


class Scheduler {
    public runScheduleTasks() {
        logger.info('Running schedule task');
    }
}

export default function executeScheduler() {
    const scheduler = new Scheduler();
    cron.schedule(`${SCHEDULE_MINUTE} ${SCHEDULE_HOUR} ${SCHEDULE_DOM} ${SCHEDULE_MONTH} ${SCHEDULE_DOW}`, scheduler.runScheduleTasks);
}