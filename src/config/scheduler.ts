import InterestDao from "@daos/InterestDao";
import PlanDao, { SearchPlanCriteria } from "@daos/PlanDao";
import { Topics } from "@entities/Interest";
import { Plan } from "@entities/Plan";
import logger from "@shared/Logger";
import NeededFactorsConverter from "@utils/NeededFactorsConverter";

const cron = require('node-cron');

const { SCHEDULE_MINUTE, SCHEDULE_HOUR, SCHEDULE_DOM, SCHEDULE_MONTH, SCHEDULE_DOW } = process.env;

const planDao = new PlanDao();
const inerestDao = new InterestDao();

class Scheduler {
    public async runScheduleTasks() {
        await this.fetchPlans();
    }

    private async fetchPlans() {
        const searchPlanCriteria = new SearchPlanCriteria();
        searchPlanCriteria.expired = false;
        const plans: any = await planDao.search(searchPlanCriteria);
        const now = new Date();
        if (plans.length > 0) {
            logger.info(`Found ${plans.length} going plans`);
        }
        for (let plan of plans) {
            const endDate = plan.to;
            if (now >= endDate) {
                // TODO: Send notification to owner
                plan.expired = true;
                await plan.save();
            } else {
                this.broadcastNeededFactors(plan);
            }
        }
    }

    private async broadcastNeededFactors(plan: Plan) {
        const { owner, plantDetails } = plan;
        const now = new Date();
        const currentPlanIndex = plantDetails.findIndex(planDetail => {
            return planDetail.from <= now && now <= planDetail.to;
        });
        if (currentPlanIndex > -1) {
            const currentPlan = plantDetails[currentPlanIndex];
            if (!currentPlan.isBroadcasted) {
                const neededFactors = currentPlan.neededFactors;
                await Promise.all(neededFactors.map(needed => {
                    const neededConverter = new NeededFactorsConverter(needed);
                    const newInerest = {
                        user: owner,
                        topic: Topics.PRODUCT_REQUEST,
                        attributes: neededConverter.toAttributes()
                    } as any;
                    return inerestDao.add(newInerest);
                }));

                plan.plantDetails[currentPlanIndex].isBroadcasted = true;
                await plan.save();
            }
        }
    }
}

export default function executeScheduler() {
    const scheduler = new Scheduler();
    cron.schedule(`${SCHEDULE_MINUTE} ${SCHEDULE_HOUR} ${SCHEDULE_DOM} ${SCHEDULE_MONTH} ${SCHEDULE_DOW}`, async () => scheduler.runScheduleTasks());
}