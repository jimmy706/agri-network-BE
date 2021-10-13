import logger from '@shared/Logger';
import neo4j, { Result } from 'neo4j-driver';

const { NEO4J_USER, NEO4J_PASSWORD, NEO4J_HOST, NEO4J_PORT, NEO4J_DB_NAME } = process.env;


const driver = neo4j.driver(`bolt://${NEO4J_HOST || 'localhost' }:${NEO4J_PORT || '7687'}`, neo4j.auth.basic(NEO4J_USER || 'neo4j', NEO4J_PASSWORD || 'b1709272'));


export async function runNeo4jQuery(query: string, params: Object = {}): Promise<Result> {
    const session = driver.session({ database: NEO4J_DB_NAME });

    logger.info(`Run query ${query}`);

    const result = await session.run(query, params);
    session.close();

    return result;
}

export async function createNeo4jTransaction(query: string, params: Object = {}) {
    const session = driver.session({ database: NEO4J_DB_NAME });

    const result = await session.writeTransaction((transaction) => {
        return transaction.run(query, params);
    });
    const singleRecord = result.records[0];
    session.close();
    return singleRecord;

}


