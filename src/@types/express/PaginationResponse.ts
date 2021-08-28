type PaginationResponse<T> = {
    count: number;
    result: T[];
    hasNext: boolean;
}

export default PaginationResponse;