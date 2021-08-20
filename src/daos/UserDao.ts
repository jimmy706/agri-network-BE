import UserModel, { User } from '@entities/User';
import FirebaseUser from 'src/@types/express/FireBaseUser';
import FirebaseDao from './FirebaseDao';

export interface IUserDao {
    getOne: (email: string) => Promise<User | null>;
    getAll: () => Promise<User[]>;
    add: (user: User) => Promise<User>;
    update: (user: User) => Promise<void>;
    delete: (id: string) => Promise<void>;
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
        const { username, password, firstName, lastName, avatar, phoneNumber, email } = savedUser;
        const firebaseImporedUser: FirebaseUser = {
            uid: username,
            displayName: `${firstName} ${lastName}`,
            phoneNumber,
            passwordHash: Buffer.from(password || 'b1709272'),
            email,
        }
        if(avatar) {
            firebaseImporedUser.photoURL = avatar;
        }
        const importUserResult = await firebaseDao.importUsers([firebaseImporedUser]);
        if(importUserResult && importUserResult.errors && importUserResult.errors.length > 0) {
            throw importUserResult.errors[0].error.message;
        }
        return savedUser;
    }


    public async update(user: User): Promise<void> {
        // TODO
        return Promise.resolve(undefined);
    }


    public async delete(id: string): Promise<void> {
        UserModel.deleteOne({_id: id})
    }
}

export default UserDao;
