"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";
import {
    Bold, Italic, Strikethrough, Code, Link2, List, ListOrdered,
    CheckSquare, AlignLeft, AlignCenter, AlignRight, Highlighter,
    Heading2, Heading3, Quote, Minus, Undo, Redo,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface RichTextEditorProps {
    content?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    className?: string;
    editable?: boolean;
    minHeight?: string;
}

function ToolbarButton({
    onClick,
    isActive,
    tooltip,
    children,
    disabled,
}: {
    onClick: () => void;
    isActive?: boolean;
    tooltip: string;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <Tooltip content={tooltip}>
            <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onClick(); }}
                disabled={disabled}
                className={cn(
                    "h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                    isActive && "bg-muted text-foreground"
                )}
            >
                {children}
            </button>
        </Tooltip>
    );
}

export function RichTextEditor({
    content = "",
    onChange,
    placeholder = "Start typing…",
    className,
    editable = true,
    minHeight = "120px",
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: { HTMLAttributes: { class: "not-prose" } } }),
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline cursor-pointer" } }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight.configure({ multicolor: false }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3",
                    `min-h-[${minHeight}]`
                ),
            },
        },
    });

    if (!editor) return null;

    if (!editable) {
        return (
            <div className={cn("prose prose-sm dark:prose-invert max-w-none px-4 py-3", className)}>
                <EditorContent editor={editor} />
            </div>
        );
    }

    return (
        <div className={cn("border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
                {/* History */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} tooltip="Undo" disabled={!editor.can().undo()}>
                    <Undo className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} tooltip="Redo" disabled={!editor.can().redo()}>
                    <Redo className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Headings */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} tooltip="Heading 2">
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} tooltip="Heading 3">
                    <Heading3 className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Marks */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} tooltip="Bold (⌘B)">
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} tooltip="Italic (⌘I)">
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} tooltip="Strikethrough">
                    <Strikethrough className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} tooltip="Inline Code">
                    <Code className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} tooltip="Highlight">
                    <Highlighter className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Lists */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} tooltip="Bullet List">
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} tooltip="Numbered List">
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive("taskList")} tooltip="Task List">
                    <CheckSquare className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} tooltip="Quote">
                    <Quote className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Alignment */}
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} tooltip="Align Left">
                    <AlignLeft className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} tooltip="Align Center">
                    <AlignCenter className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} tooltip="Align Right">
                    <AlignRight className="h-3.5 w-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Horizontal Rule">
                    <Minus className="h-3.5 w-3.5" />
                </ToolbarButton>
            </div>

            {/* Editor content */}
            <EditorContent editor={editor} />
        </div>
    );
}
