import FollowModel from "@entities/Follow";
import ProvinceModel, { Province } from "@entities/Province";
import UserModel from "@entities/User";
import logger from "@shared/Logger";
import citiesJson from "spec/support/cities.json";
import {  runNeo4jQuery } from "src/config/neo4j";

const cities = JSON.parse(JSON.stringify(citiesJson));


export default async function () {
    // const users = await UserModel.find();
    // await Promise.all(users.map(u => {
    //     return new Promise(r => {
    //         r(new FollowModel({owner: u._id}).save());
    //     })
    // }));
 
    // try {
    //     await ProvinceModel.deleteMany({});
    //     await runNeo4jQuery(`MATCH (n) DETACH DELETE n`);
    //     const provinces: Province[] = [];

    //     for (let key in cities) {
    //         const p: Province = new Province(cities[key].name, parseInt(cities[key].code));
    //         provinces.push(p);
    //     }
    //     let queryInsertProvinces: string = provinces.map((p,i) => `CREATE (p${i}:Province {name: '${p.name}'})`).join('\n');
    //     await runNeo4jQuery(queryInsertProvinces);
    //     await ProvinceModel.insertMany(provinces);
    // }
    // catch (error) {
    //     logger.err(error);
    // }
};