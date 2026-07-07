import { queryOptions } from "@tanstack/react-query";
import { getLotteryFeed, type LotteryFeed } from "./lottery.functions";

export const lotteryQueryOptions = queryOptions({
  queryKey: ["lottery-feed"],
  queryFn: () => getLotteryFeed({ data: {} }) as Promise<LotteryFeed>,
  staleTime: 5 * 60_000,
  refetchInterval: 5 * 60_000,
  refetchOnWindowFocus: true,
});

export type { LotteryFeed };