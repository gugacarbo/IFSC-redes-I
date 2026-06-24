export type Paginated<T extends object> = T & {
	total: number;
	offset: number;
	limit: number;
};
