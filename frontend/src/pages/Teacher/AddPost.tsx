import PostForm from "@/components/Post/PostForm";

export default function TeacherAddPost() {
    return (
        <div className="container py-4" style={{ maxWidth: 640 }}>
            <div className="mb-4">
                <h2 className="fw-bold mb-1">New post</h2>
                <p className="text-muted small mb-0">
                    Share an announcement, curriculum note, or homework with your students.
                </p>
            </div>
            <PostForm />
        </div>
    );
}
