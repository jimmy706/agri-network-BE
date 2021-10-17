import InterestModel, { Interest } from "@entities/Interest";
import { FilterQuery, PaginateOptions, PaginateResult } from "mongoose";

export const DEFAULT_LIMIT_INTEREST = 3;

export class SearchInterestCriteria {
    limit: number;
    page: number;
    fromDate?: Date;
    toDate?: Date;
    user?:string;

    public constructor(limit: number, page: number) {
        this.limit = limit;
        this.page = page;
    }

    public toQuery():FilterQuery<Interest> {
        let result: any = {};
        if(this.user){
            result.user = {
                $match: this.user
            }
        }
        if(this.fromDate && this.toDate) {
            result.createdDate = {
                $gte: this.fromDate,
                $lte: this.toDate
            }
        }

        return result;
    }
}

export default class InterestDao {
    public async add(interest: Interest): Promise<Interest> {
        const newInterest = new InterestModel(interest);
        newInterest.createdDate = new Date();
        await newInterest.save();

        return newInterest;
    }
    

    public async search(criteria: SearchInterestCriteria) {
        const query = criteria.toQuery();
        const options: PaginateOptions = {
            page: criteria.page,
            limit: criteria.limit,
            sort: { createdDate: -1 }
        }
        const interests: PaginateResult<Interest> = await new Promise((resolve, reject) => {
            InterestModel.paginate(query, options, (error, result) => {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            })
        });

        return interests;
    }
}