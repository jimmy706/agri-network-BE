import UserModel, { User } from '@entities/User';
import { auth } from 'firebase-admin';
import FirebaseUser from 'src/@types/express/FireBaseUser';
import { runNeo4jQuery, createNeo4jTransaction } from 'src/config/neo4j';
import FirebaseDao from './FirebaseDao';

export interface IUserDao {
    getOne: (email: string) => Promise<User | null>;
    getAll: () => Promise<User[]>;
    add: (user: User) => Promise<User>;
    update: (user: User) => Promise<void>;
    delete: (id: string) => Promise<void>;
    login: (idToken: string) => Promise<auth.DecodedIdToken>;
}

const firebaseDao = new FirebaseDao();

class UserDao implements IUserDao {


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
        const { firstName, lastName, email } = savedUser;

        const queryAddUserNode = `CREATE (u:User {name: $name, email: $email}) RETURN u`;
        const queryParam = {
            name: `${firstName} ${lastName}`,
            email
        };
        await createNeo4jTransaction(queryAddUserNode, queryParam);
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
