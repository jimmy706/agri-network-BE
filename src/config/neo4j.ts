import neo4j, { Result } from 'neo4j-driver';

const { NEO4J_USER, NEO4J_PASSWORD, NEO4J_HOST, NEO4J_PORT, NEO4J_DB_NAME } = process.env;


const driver = neo4j.driver(`bolt://${NEO4J_HOST}:${NEO4J_PORT}`, neo4j.auth.basic(NEO4J_USER || 'neo4j', NEO4J_PASSWORD || 'b1709272'));

const session = driver.session({ database: NEO4J_DB_NAME });

async function runNeo4jQuery(query: string, params: string = ''): Promise<Result> {
    const result = await session.run(query, params);
    const singleRecord = result.records[0]
    const node = singleRecord.get(0);
    session.close();
    driver.close();
    return node;
}

export default runNeo4jQuery;

