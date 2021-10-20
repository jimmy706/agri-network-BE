import InterestDao, { DEFAULT_LIMIT_INTEREST, SearchInterestCriteria } from "@daos/InterestDao";
import PostDao from "@daos/PostDao";
import { PostFormat } from "@entities/Post";
import { User } from "@entities/User";
import AttributeConverter from "@utils/AttributesConverter";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';

const { CREATED, OK } = StatusCodes;

const interestDao = new InterestDao();
const postDao = new PostDao();

export async function add(req: Request, res: Response): Promise<Response> {
    const authUser = JSON.parse(req.params.authUser) as User;

    const interest = req.body;
    interest.user = authUser._id;
    const newInterest = await interestDao.add(interest);
    const newPost: any = {
        content: `
<h4>${authUser.lastName} vừa đăng một nhu cầu mới: </h4>
<ul>
        ${buildPostInterestContent(new AttributeConverter(newInterest.attributes).toMap())}
</ul>        
        `,
        images: [],
        format: PostFormat.INTEREST_REQUEST,
        postedBy: authUser._id,
        tags: ["chia sẻ", "nhu cầu mua hàng"],
        attributes: newInterest.attributes,
        ref: newInterest._id
    }
    await postDao.add(newPost);

    return res.status(CREATED).json(newInterest);
}

export async function search(req: Request, res: Response): Promise<Response> {
    const criteria = new SearchInterestCriteria(DEFAULT_LIMIT_INTEREST, 1);

    const { limit, page, user, fromDate, toDate } = req.query;
    if (limit) {
        criteria.limit = parseInt(limit as string);
    }
    if (page) {
        criteria.page = parseInt(page as string);
    }
    if (user) {
        criteria.user = user as string;
    }
    if (fromDate && toDate) {
        criteria.fromDate = new Date(fromDate as string);
        criteria.toDate = new Date(toDate as string);
    }

    const result = await interestDao.search(criteria);

    return res.status(OK).json(result);
}

function buildPostInterestContent(attributes: Map<string, string>) {
    const result: string[] = [];
    if (attributes.has('name')) {
        result.push(`<li>Sản phẩm ${attributes.get('name')}</li>`);
    }
    if (attributes.has('priceFrom') && attributes.has('priceTo')) {
        const priceFrom = parseFloat(attributes.get('priceFrom') as string);
        const priceTo = parseFloat(attributes.get('priceTo') as string);
        const currencyFormatter = new Intl.NumberFormat('vi-VI', {
            style: 'currency',
            currency: 'VND',
        });
        result.push(`<li>Giá từ ${currencyFormatter.format(priceFrom)} đến ${currencyFormatter.format(priceTo)}</li>`);
    }

    return result.join('\n');
}