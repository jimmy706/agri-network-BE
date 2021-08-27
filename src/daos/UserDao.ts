import UserModel, { User } from '@entities/User';
import { auth } from 'firebase-admin';
import { createNeo4jTransaction, runNeo4jQuery } from 'src/config/neo4j';
import FirebaseDao from './FirebaseDao';


const firebaseDao = new FirebaseDao();

class UserDao {


    public getOne(email: string): Promise<User | null> {
        // TODO
        return Promise.resolve(null);
    }


    public async getAll(): Promise<User[]> {
        const result = await UserModel.find();
        return result;
    }



    public async add(user: User): Promise<User> {
        const newUser = new UserModel(user);
        const savedUser = await newUser.save();
        const { firstName, lastName, email, province } = savedUser;

        const queryAddUserNode = `
            MATCH (p:Province{name: $province}) 
            CREATE (u:User {name: $name, email: $email})
            CREATE (u)-[:LIVED_IN]->(p)
            `;
        const queryParam = {
            name: `${firstName} ${lastName}`,
            email,
            province
        };
        await runNeo4jQuery(queryAddUserNode, queryParam);
        return savedUser;
    }

    public async login(idToken: string): Promise<auth.DecodedIdToken> {
        const result = await firebaseDao.verifyIdToken(idToken);
        return result;
    }


    public async update(user: User): Promise<void> {
        // TODO
        return Promise.resolve(undefined);
    }


    public async delete(id: string): Promise<void> {
        UserModel.deleteOne({ _id: id })
    }
}

export default UserDao;
