"use client";

import { useState } from "react";
import { useAddComment } from "@/lib/hooks/use-tasks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { getInitials, stringToColor, formatRelativeTime } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { MessageSquare } from "lucide-react";

interface TaskCommentsProps {
    comments: any[];
    taskId: string;
    projectId: string;
    currentUserId: string;
}

export function TaskComments({ comments, taskId, projectId, currentUserId }: TaskCommentsProps) {
    const [body, setBody] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const addComment = useAddComment(taskId);

    const handleSubmit = async () => {
        if (!body.trim() || body === "<p></p>") return;
        await addComment.mutateAsync({ content: body, author_id: currentUserId });
        setBody("");
        setIsOpen(false);
    };

    return (
        <div className="space-y-4">
            {/* Comment list */}
            {comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                <AvatarImage src={comment.author?.avatar_url} />
                                <AvatarFallback className="text-[9px]" style={{ backgroundColor: stringToColor(comment.author?.full_name || "") }}>
                                    {getInitials(comment.author?.full_name || "")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-sm font-medium">{comment.author?.full_name}</span>
                                    <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
                                </div>
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body) }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No comments yet. Be the first!</p>
                </div>
            )}

            {/* Add comment */}
            {isOpen ? (
                <div className="space-y-2 pt-2">
                    <RichTextEditor
                        content={body}
                        onChange={setBody}
                        placeholder="Add a comment…"
                        minHeight="80px"
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => { setBody(""); setIsOpen(false); }}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={addComment.isPending || !body.trim() || body === "<p></p>"}
                        >
                            {addComment.isPending ? "Posting…" : "Post Comment"}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                </Button>
            )}
        </div>
    );
}
