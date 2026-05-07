export type Paginated<T = {}> = T & {
	total: number;
	offset: number;
	limit: number;
};
