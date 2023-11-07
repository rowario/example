import { FC, useState } from "react";

import { Geo, Language } from "@app/database";
import { Box, Button, Center, Grid, LoadingOverlay, Paper, Select, Text, TextInput, useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { TRPCClientError } from "@trpc/client";
import { useTranslation } from "next-i18next";

import geo from "@/data/geo";
import languages from "@/data/languages";
import { api } from "@/utils/api";
import { getCategoryName } from "@/utils/getCategoryName";

export const AddChannelWidgets: FC = () => {
	const theme = useMantineTheme();

	const [done, setDone] = useState(false);

	const { t } = useTranslation("add");
	const { t: common } = useTranslation("common");

	const form = useForm({
		initialValues: {
			username: "",
			geo: "" as Geo,
			language: "" as Language,
			category: "",
		},
		validate: {
			username: (value) => (value.length > 0 ? null : t("channel.validation.username")),
			geo: (value) => (value.length > 0 ? null : t("channel.validation.geo")),
			language: (value) => (value.length > 0 ? null : t("channel.validation.language")),
			category: (value) => (value.length > 0 ? null : t("channel.validation.category")),
		},
	});

	const { mutate: addChannel, isLoading } = api.channel.create.useMutation({
		onSuccess() {
			form.reset();
			setDone(true);
		},
		onError(e) {
			const possibleErrors = [
				"CONFLICT_CHANNEL",
				"CONFLICT_REQUEST",
				"CONFLICT_WRONG_ENTITY",
				"NOT_FOUND_CATEGORY",
				"NOT_FOUND_CHAT",
				"NOT_FOUND_FULL_CHAT",
				"NOT_FOUND_WORKER",
				"TOTAL_ERROR",
			] as const;

			const message = possibleErrors.find((x) => x === e.message);
			if (e instanceof TRPCClientError && message) {
				showNotification({
					color: "red",
					title: t("channel.errors.title"),
					message: t(`channel.errors.${message}`),
				});
			} else {
				showNotification({
					color: "red",
					title: t("channel.errors.title"),
					message: t(`channel.errors.default`),
				});
			}
		},
	});

	const { data: categoriesResponse } = api.category.all.useQuery();

	const categories = categoriesResponse ?? [];

	return (
		<Grid>
			<Grid.Col span={12}>
				<Text align="center" mb={0} size={34} component="h1" weight={700}>
					{t("channel.title")}
				</Text>
				<Text size={18} color="gray" align="center">
					{t("channel.subTitle")}
				</Text>
			</Grid.Col>
			<Grid.Col xl={8} offsetXl={2}>
				<Paper withBorder p="xl" sx={{ position: "relative" }}>
					{done && (
						<Box>
							<Center>
								<IconCheck color={theme.colors.green[5]} size={45} />
							</Center>
							<Text align="center" color="gray" size={20}>
								{t("channel.done.message")}
							</Text>
							<Center>
								<Button mt={8} onClick={() => setDone(false)} compact>
									{t("channel.done.addMore")}
								</Button>
							</Center>
						</Box>
					)}
					{!done && (
						<form onSubmit={form.onSubmit((values) => addChannel(values))}>
							<LoadingOverlay visible={isLoading} />
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									gap: 8,
								}}
							>
								<TextInput
									{...form.getInputProps("username")}
									label={t("channel.inputs.username.label")}
									placeholder={t("channel.inputs.username.placeholder")}
								/>
								<Select
									data={geo.map((x) => ({
										label: common(`geo.${x}`),
										value: x,
									}))}
									{...form.getInputProps("geo")}
									label={t("channel.inputs.geo.label")}
									placeholder={t("channel.inputs.geo.placeholder")}
								/>
								<Select
									data={languages.map((x) => ({
										label: common(`languages.${x}`),
										value: x,
									}))}
									{...form.getInputProps("language")}
									label={t("channel.inputs.language.label")}
									placeholder={t("channel.inputs.language.placeholder")}
								/>
								<Select
									data={categories.map((x) => ({
										label: common(`categories.${getCategoryName(x)}`),
										value: x.link,
									}))}
									{...form.getInputProps("category")}
									label={t("channel.inputs.category.label")}
									placeholder={t("channel.inputs.category.placeholder")}
								/>
							</Box>
							<Button type="submit" mt={12}>
								{t("channel.send")}
							</Button>
						</form>
					)}
				</Paper>
			</Grid.Col>
		</Grid>
	);
};
