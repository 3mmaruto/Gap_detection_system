import PostForm from "@/components/Post/PostForm";

export default function AdminAddPost() {
    return (
        <div className="container py-4" style={{ maxWidth: 640 }}>
            <div className="mb-4">
                <h2 className="fw-bold mb-1">New post</h2>
                <p className="text-muted small mb-0">
                    Publish an announcement, curriculum update, or homework assignment.
                </p>
            </div>
            <PostForm />
        </div>
    );
}
