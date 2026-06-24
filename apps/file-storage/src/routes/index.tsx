import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { Home } from "#/app/home";

const fileSearchParamsSchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	search: z.string().optional(),
});

export type FileSearchParams = z.infer<typeof fileSearchParamsSchema>;

export const Route = createFileRoute("/")({
	component: Home,
	validateSearch: (search) => fileSearchParamsSchema.parse(search),
});
