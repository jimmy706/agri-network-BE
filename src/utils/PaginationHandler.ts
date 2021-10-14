import PaginationResponse from "@entities/PaginationResponse";

export default class PaginationHandler<T> {
    limit: number;
    page: number;
    docs: T[];
    totalDocs: number;

    constructor(limit: number, page: number, docs: T[], totalDocs: number) {
        this.limit = limit;
        this.page = page;
        this.docs = docs;
        this.totalDocs = totalDocs;
    }

    public static getStartIndex(page: number, limit: number) {
        return (page - 1) * limit;
    }

    public static getEndIndex(page: number, limit: number) {
        return page * limit;
    }

    public hasNextPage() {
        return PaginationHandler.getEndIndex(this.page, this.limit) < (this.totalDocs - 1);
    }

    public hasPrevPage() {
        return this.page > 1;
    }

    public getNextPage() {
        return this.hasNextPage() ? this.page + 1 : this.page;
    }

    public getPrevPage() {
        return this.hasPrevPage() ? this.page - 1 : this.page;
    }

    public toPaginationResponse(): PaginationResponse<T> {
        return {
            page: this.page,
            limit: this.limit,
            hasNextPage: this.hasNextPage(),
            hasPrevPage: this.hasPrevPage(),
            nextPage: this.getNextPage(),
            prevPage: this.getPrevPage(),
            totalDocs: this.totalDocs,
            docs: this.docs
        }
    }
}