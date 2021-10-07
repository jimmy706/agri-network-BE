type PaginationResponse<T> = {
    totalDocs: number;
    docs: T[];
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number;
    prevPage: number;
    totalPages?: number;
}

export default PaginationResponse;