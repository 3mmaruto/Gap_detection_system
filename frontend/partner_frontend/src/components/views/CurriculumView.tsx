import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import FilterBar from "@/components/Filters/FilterBar";
import PostSection from "@/components/Post/PostSection";
import { useSubjects } from "@/hooks/useSubjects";
import { usePosts } from "@/hooks/usePosts";
import { useFilter } from "@/hooks/useFilter";
import { useAuth } from "@/hooks/useAuth";
import { ALL } from "@/hooks/useFilter";
import { POST_TYPE_LABELS } from "@/types/models.types";
import type { PostType } from "@/types/models.types";

const CURRICULUM_TYPES: { value: PostType; label: string }[] = [
    { value: "CURRICULUM_POST", label: POST_TYPE_LABELS.CURRICULUM_POST },
    { value: "HOMEWORK", label: POST_TYPE_LABELS.HOMEWORK },
];

export default function CurriculumView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { subjects } = useSubjects();
    const { selected: subject, setSelected: setSubject } = useFilter<number>();
    const { selected: type, setSelected: setType } = useFilter<PostType>();

    // "All" in this view = CURRICULUM_POST; backend will also return HOMEWORK under that subject.
    // When a specific type is chosen use it; when "all" default to CURRICULUM_POST to exclude ANNOUNCEMENT.
    const resolvedType: PostType | undefined =
        type === ALL ? undefined : (type as PostType);

    const { posts: allPosts, loading } = usePosts(subject, resolvedType);

    // Client-side guard: never show announcements regardless of backend response
    const posts = allPosts.filter((p) => p.type !== "ANNOUNCEMENT");

    const canPost = user?.role === "admin" || user?.role === "teacher";

    return (
        <>
            <FilterBar
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                value={subject}
                onChange={setSubject}
            />
            <Card>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div className="d-flex gap-2 align-items-center">
                        <span className="text-muted small fw-semibold me-1">
                            Type:
                        </span>
                        <FilterBar
                            options={CURRICULUM_TYPES}
                            value={type}
                            onChange={setType}
                            allLabel="All"
                        />
                    </div>
                    {canPost && (
                        <button
                            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                            onClick={() =>
                                navigate("/add-post?type=CURRICULUM_POST")
                            }
                        >
                            <i className="bi bi-book" />
                            New post
                        </button>
                    )}
                </div>
                <PostSection
                    title="Curriculum Resources"
                    posts={posts}
                    loading={loading}
                    emptyLabel="No resources for this selection."
                />
            </Card>
        </>
    );
}
