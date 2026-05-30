import Post from "./Post";
import type { Post as PostModel } from "@/types/models.types";

interface PostSectionProps {
    title?: string;
    posts: PostModel[];
    loading?: boolean;
    emptyLabel?: string;
    onPostClick?: (post: PostModel) => void;
}

export default function PostSection({
    title = "Posts",
    posts,
    loading = false,
    emptyLabel = "Nothing here yet.",
    onPostClick,
}: PostSectionProps) {
    return (
        <div className="container-fluid">
            <h3 className="mb-4">{title}</h3>
            {loading ? (
                <p className="text-muted">Loading…</p>
            ) : posts.length === 0 ? (
                <p className="text-muted">{emptyLabel}</p>
            ) : (
                <div className="d-flex flex-wrap gap-2">
                    {posts.map((post) => (
                        <Post key={post.id} post={post} onClick={onPostClick} />
                    ))}
                </div>
            )}
        </div>
    );
}
