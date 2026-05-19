import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";

/**
 * NexusFlow — Button component stories
 *
 * Demonstrates all variants and states.
 * The @storybook/addon-a11y panel will flag any contrast issues.
 */

const meta: Meta<typeof Button> = {
    title: "UI/Button",
    component: Button,
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
        },
        size: {
            control: "select",
            options: ["default", "sm", "lg", "icon", "icon-sm"],
        },
        disabled: { control: "boolean" },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
    args: { children: "Create Project", variant: "default" },
};

export const Destructive: Story = {
    args: { children: "Delete Sprint", variant: "destructive" },
};

export const Outline: Story = {
    args: { children: "Cancel", variant: "outline" },
};

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <Plus />
                Add Task
            </>
        ),
        variant: "default",
    },
};

export const Loading: Story = {
    args: {
        children: (
            <>
                <Loader2 className="animate-spin" />
                Saving…
            </>
        ),
        disabled: true,
        variant: "default",
    },
};

export const IconOnly: Story = {
    args: {
        children: <Trash2 />,
        variant: "ghost",
        size: "icon",
        "aria-label": "Delete task",
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-3 p-4 bg-background">
            {(["default", "destructive", "outline", "secondary", "ghost", "link"] as const).map((v) => (
                <Button key={v} variant={v}>
                    {v}
                </Button>
            ))}
        </div>
    ),
};
