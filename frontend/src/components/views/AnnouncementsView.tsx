import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import PostSection from "@/components/Post/PostSection";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";

export default function AnnouncementsView() {
    const { posts: allPosts, loading } = usePosts(undefined, "ANNOUNCEMENT");
    const posts = allPosts.filter((p) => p.type === "ANNOUNCEMENT");
    const { user } = useAuth();
    const navigate = useNavigate();

    const canPost = user?.role === "admin" || user?.role === "teacher";

    return (
        <Card title="Announcements">
            {canPost && (
                <div className="d-flex justify-content-end mb-3">
                    <button
                        className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                        onClick={() => navigate("/add-post?type=ANNOUNCEMENT")}
                    >
                        <i className="bi bi-megaphone" />
                        New announcement
                    </button>
                </div>
            )}
            <PostSection
                posts={posts}
                loading={loading}
                emptyLabel="No announcements yet."
            />
        </Card>
    );
}
