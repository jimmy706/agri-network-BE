import UserModel, { User } from '@entities/User';



export interface IUserDao {
    getOne: (email: string) => Promise<User | null>;
    getAll: () => Promise<User[]>;
    add: (user: User) => Promise<User>;
    update: (user: User) => Promise<void>;
    delete: (id: number) => Promise<void>;
}

class UserDao implements IUserDao {


    public getOne(email: string): Promise<User | null> {
        // TODO
        return Promise.resolve(null);
    }


    public getAll(): Promise<User[]> {
        // TODO
        return Promise.resolve([]);
    }



    public async add(user: User): Promise<User> {
        const newUser = new UserModel(user);
        const savedUser = await newUser.save();
        return savedUser;
    }


    public async update(user: User): Promise<void> {
        // TODO
        return Promise.resolve(undefined);
    }


    public async delete(id: number): Promise<void> {
        // TODO
        return Promise.resolve(undefined);
    }
}

export default UserDao;
