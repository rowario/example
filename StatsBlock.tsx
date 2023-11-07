import { FC, useMemo, useState } from "react";

import { Channel } from "@app/database";
import { Box, Center, LoadingOverlay, Paper, SegmentedControl, Text, Tooltip, Tuple, useMantineTheme } from "@mantine/core";
import { linearGradientDef } from "@nivo/core";
import { ResponsiveLine } from "@nivo/line";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useTranslation } from "next-i18next";

import useMobile from "@/hooks/useMobile";
import { api } from "@/utils/api";
import getShortNumber from "@/utils/getShortNumber";

dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);

type StatsType =
	| "subscribersStatDay"
	| "viewsStatDay"
	| "totalViewsStatDay"
	| "eRRStatDay"
	| "postsStatDay"
	| "involvementStatDay";
type Range = "week" | "month" | "year" | "all";
type Step = "day" | "week" | "month";

const formats = {
	day: (date: Date) => dayjs(date).format("MMMM D YYYY"),
	week: (date: Date) => `${dayjs(date).day(0).format("MMMM D YYYY")} - ${dayjs(date).day(6).format("MMMM D YYYY")}`,
	month: (date: Date) => dayjs(date).format("MMMM YYYY"),
};

export const StatsBlock: FC<{
	channel: Channel;
	type: StatsType;
	color: Tuple<string, 10>;
	title: string;
	about: string;
	tooltipText: string;
	id: string;
	min?: number;
	max?: number;
	float?: boolean;
	percent?: boolean;
}> = ({ channel, type, color, title, about, id, tooltipText, min, max, float = false, percent = false }) => {
	const [range, setRange] = useState<Range>("month");
	const [step, setStep] = useState<Step>("day");

	let { data: stats = [], isFetching } = api.stats.getChannelStats.useQuery({
		channelId: channel.chatId,
		type,
		range,
		step,
		order: "asc",
	});

	const { t } = useTranslation("stats");
	const theme = useMantineTheme();
	const isMobile = useMobile();

	const dataset = useMemo(() => {
		return {
			id,
			data: stats.map((x) => ({
				x: formats[step](x.createdAt),
				y: x.amount,
			})),
		};
	}, [stats, range, step]);

	const maxVal = useMemo(() => (!max ? Math.max(0, ...dataset.data.map((x) => x.y)) : max), [dataset]);
	const minVal = useMemo(() => (!min ? Math.min(maxVal, ...dataset.data.map((x) => x.y)) : min), [dataset]);

	const valueParse = (v: string) => getShortNumber(float ? parseFloat(v) : parseInt(v));

	return (
		<Paper withBorder p="xl" sx={{ position: "relative" }}>
			<LoadingOverlay visible={isFetching} overlayBlur={2} sx={{ borderRadius: 8 }} />
			<Center>
				<Text
					sx={(theme) => ({
						[theme.fn.smallerThan("xs")]: {
							lineHeight: 1,
							textAlign: "center",
						},
					})}
					weight={700}
					size={24}
				>
					{title}
				</Text>
			</Center>
			<Box
				sx={(theme) => ({
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					[theme.fn.smallerThan("xs")]: {
						flexDirection: "column",
						gap: 8,
					},
				})}
				mt={24}
			>
				<Tooltip label={t("charts.rangeTitle")}>
					<SegmentedControl
						fullWidth={isMobile}
						value={range}
						onChange={(value) => setRange(value as Range)}
						color="gray"
						transitionDuration={0}
						size="xs"
						data={[
							{ label: t("charts.range.week"), value: "week" },
							{ label: t("charts.range.month"), value: "month" },
							{ label: t("charts.range.year"), value: "year" },
							{ label: t("charts.range.all"), value: "all" },
						]}
					/>
				</Tooltip>
				<Tooltip label={t("charts.stepTitle")}>
					<SegmentedControl
						fullWidth={isMobile}
						value={step}
						onChange={(value) => setStep(value as Step)}
						color="gray"
						transitionDuration={0}
						size="xs"
						data={[
							{ label: t("charts.step.day"), value: "day" },
							{ label: t("charts.step.week"), value: "week" },
							{ label: t("charts.step.month"), value: "month" },
						]}
					/>
				</Tooltip>
			</Box>
			<Box
				sx={{
					marginTop: 16,
					height: 260,
				}}
			>
				<ResponsiveLine
					pointSize={dataset.data.length < 50 && !isMobile ? 6 : 0}
					pointBorderColor={"white"}
					pointBorderWidth={2}
					curve="monotoneX"
					data={[dataset]}
					animate={false}
					defs={[
						linearGradientDef(`gradient${id}`, [
							{ offset: 0, color: color[9], opacity: 1 },
							{ offset: 100, color: color[5], opacity: 0.5 },
						]),
					]}
					fill={[
						{
							match: {
								id: dataset.id,
							},
							id: `gradient${id}`,
						},
					]}
					margin={{
						top: 0,
						bottom: 1,
						left: 30,
						right: 2,
					}}
					yScale={{
						type: "linear",
						min: minVal - minVal * 0.1,
						max: maxVal + maxVal * 0.1,
					}}
					theme={{
						axis: {
							domain: {
								line: {
									stroke: theme.colors.gray[5],
									strokeWidth: 1,
								},
							},
						},
					}}
					crosshairType="x"
					enableGridX={false}
					enableGridY={false}
					axisBottom={{
						tickSize: 0,
					}}
					axisLeft={{
						format: (value) => (
							<tspan x={0} y={0}>
								{getShortNumber(value)}
							</tspan>
						),
						ticksPosition: "before",
						tickPadding: 3,
						tickSize: 0,
						tickValues: 3,
					}}
					isInteractive={true}
					enableSlices="x"
					sliceTooltip={({ slice: { points } }) => {
						const point = points.at(0);
						if (!point) return <></>;
						const data = point.data;
						return (
							<Paper withBorder p={4}>
								<Text weight={400} size={10}>{`${data.x.toString()}`}</Text>
								<Text weight={700} size={12}>
									{`${valueParse(data.y.toString())}${percent ? "%" : ""} ${tooltipText}`}
								</Text>
							</Paper>
						);
					}}
					colors={[color[5]]}
					enableArea={true}
				/>
			</Box>
			<Box
				sx={(theme) => ({
					marginTop: 24,
					textAlign: "center",
					backgroundColor: theme.colors.gray[1],
					padding: theme.spacing.md,
					borderRadius: theme.radius.md,
					fontSize: 14,
				})}
			>
				{about}
			</Box>
		</Paper>
	);
};
