import { Dispatch, FC, SetStateAction, useState } from "react";

import { ActionIcon, Box, Button, Center, Modal, Textarea, TextInput, Tooltip, Text, useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconQuestionMark } from "@tabler/icons-react";
import { TRPCError } from "@trpc/server";
import { useTranslation } from "next-i18next";

import { api } from "@/utils/api";

export const TopicCreateModal: FC<{
	opened: boolean;
	setOpened: Dispatch<SetStateAction<boolean>>;
}> = ({ opened, setOpened }) => {
	const theme = useMantineTheme();

	const [sent, setSent] = useState(false);

	const { t } = useTranslation("topics");

	const form = useForm({
		initialValues: {
			name: "",
			description: "",
			link: "",
		},
		validate: {
			name: (value) => (value.length > 0 ? null : t("modals.create.validation.name")),
			description: (value) => (value.length > 0 ? null : t("modals.create.validation.description")),
			link: (value) => (value.length > 0 ? null : t("modals.create.validation.link")),
		},
	});

	const utils = api.useContext();

	const { mutate: createTopic } = api.topic.create.useMutation({
		async onSuccess(topic) {
			form.reset();
			setSent(true);
			showNotification({
				color: "green",
				title: t("modals.create.notifications.success.title"),
				message: t("modals.create.notifications.success.message", { name: topic.name }),
			});
			await utils.topic.all.refetch();
		},
		onError(e) {
			const possibleErrors = ["UNAUTHORIZED", "CONFLICT"] as const;
			if (e instanceof TRPCError && possibleErrors.find((x) => x === e.code)) {
				const code = possibleErrors.find((x) => x === e.code);
				if (code) {
					showNotification({
						color: "red",
						title: t("modals.create.notifications.addTitle"),
						message: t(`modals.create.notifications.errors.${code}`),
					});
				}
			} else {
				showNotification({
					color: "red",
					title: t("modals.create.notifications.addTitle"),
					message: t(`modals.create.notifications.errors.default`),
				});
			}
		},
	});

	return (
		<Modal title={t("modals.create.title")} opened={opened} onClose={() => setOpened(false)}>
			{sent && (
				<Box>
					<Center>
						<IconCheck size={50} color={theme.colors.green[4]} />
					</Center>
					<Text align="center" color="gray" size={16} weight={600}>
						{t("modals.create.created.title")}
					</Text>
					<Center>
						<Button compact mt={8} onClick={() => setSent(false)}>
							{t("modals.create.created.createMore")}
						</Button>
					</Center>
				</Box>
			)}
			{!sent && (
				<Box
					sx={() => ({
						display: "flex",
						flexDirection: "column",
						gap: 8,
					})}
					component={"form"}
					onSubmit={form.onSubmit((values) => createTopic(values))}
				>
					<TextInput
						{...form.getInputProps("name")}
						label={t("modals.create.inputs.name.label")}
						placeholder={t("modals.create.inputs.name.placeholder")}
					/>
					<Textarea
						{...form.getInputProps("description")}
						label={t("modals.create.inputs.description.label")}
						placeholder={t("modals.create.inputs.description.placeholder")}
					/>
					<TextInput
						{...form.getInputProps("link")}
						label={t("modals.create.inputs.link.label")}
						placeholder={t("modals.create.inputs.link.placeholder")}
						rightSection={
							<Tooltip.Floating zIndex={1000} label={t("modals.create.inputs.link.help")}>
								<ActionIcon color="gray">
									<IconQuestionMark size={18} />
								</ActionIcon>
							</Tooltip.Floating>
						}
					/>
					<Button type="submit" mt={4}>
						{t("modals.create.inputs.button")}
					</Button>
				</Box>
			)}
		</Modal>
	);
};
