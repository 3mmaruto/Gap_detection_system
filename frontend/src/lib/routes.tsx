/**
 * Single source of truth for app routes.
 *
 * To add a page:  push one entry here — the router, navbar, and role
 * redirects all derive from this array automatically.
 * Set `inNav: false` to register the route without adding it to the navbar.
 */

import type { ReactElement } from "react";
import type { Role } from "@/types/models.types";
import type { NavLink } from "@/lib/school";

import HomeView from "@/components/views/HomeView";
import AnnouncementsView from "@/components/views/AnnouncementsView";
import CurriculumView from "@/components/views/CurriculumView";
import TeacherMyStudents from "@/pages/Teacher/MyStudents";
import AdminUsersControl from "@/pages/Admin/UsersControl";
import AdminAddPost from "@/pages/Admin/AddPost";
import AdminAddUser from "@/pages/Admin/AddUser";
import TeacherAddPost from "@/pages/Teacher/AddPost";
import ProfilePage from "@/pages/Common/Profile";
import PostPage from "@/pages/Common/PostPage";
import NotificationsPage from "@/pages/Common/Notifications";
import MessagesPage from "@/pages/Common/Messages";

export interface AppRoute {
    /** URL path (use React Router syntax, e.g. "/profile/:id") */
    path: string;
    /** Label shown in the navbar — ignored when inNav is false */
    name: string;
    /** Roles that may access this route */
    roles: Role[];
    /** Page content — AppLayout is added automatically by App.tsx */
    element: ReactElement;
    /** Set to false to hide from the navbar while still registering the route */
    inNav?: boolean;
}

export const APP_ROUTES: AppRoute[] = [
    {
        path: "/home",
        name: "Home",
        roles: ["student", "teacher", "admin"],
        element: <HomeView />,
    },
    {
        path: "/announcements",
        name: "Announcements",
        roles: ["student", "teacher", "admin"],
        element: <AnnouncementsView />,
    },
    {
        path: "/curriculum",
        name: "Curriculum",
        roles: ["student", "teacher", "admin"],
        element: <CurriculumView />,
    },
    {
        path: "/my-students",
        name: "My Students",
        roles: ["teacher"],
        element: <TeacherMyStudents />,
    },
    {
        path: "/manage-users",
        name: "Manage Users",
        roles: ["admin"],
        element: <AdminUsersControl />,
    },
    {
        path: "/add-post",
        name: "New Post",
        roles: ["admin"],
        element: <AdminAddPost />,
        inNav: false,
    },
    {
        path: "/add-user",
        name: "Add User",
        roles: ["admin"],
        element: <AdminAddUser />,
        inNav: false,
    },
    {
        path: "/add-post",
        name: "New Post",
        roles: ["teacher"],
        element: <TeacherAddPost />,
        inNav: false,
    },
    {
        path: "/messages",
        name: "Messages",
        roles: ["student", "teacher", "admin"],
        element: <MessagesPage />,
        inNav: false,
    },
    {
        path: "/notifications",
        name: "Notifications",
        roles: ["student", "teacher", "admin"],
        element: <NotificationsPage />,
        inNav: false,
    },
    {
        path: "/profile/:id",
        name: "Profile",
        roles: ["student", "teacher", "admin"],
        element: <ProfilePage />,
        inNav: false,
    },
    {
        path: "/posts/:id",
        name: "Post",
        roles: ["student", "teacher", "admin"],
        element: <PostPage />,
        inNav: false,
    },
];

const navFilter = (role: Role) =>
    APP_ROUTES.filter((r) => r.roles.includes(role) && r.inNav !== false).map(
        (r): NavLink => ({ name: r.name, href: r.path }),
    );

/** Nav links visible to each role — derived from APP_ROUTES. */
export const NAVLINKS_BY_ROLE: Record<Role, NavLink[]> = {
    student: navFilter("student"),
    teacher: navFilter("teacher"),
    admin: navFilter("admin"),
};

/** First accessible route for each role = post-login landing page. */
export const HOME_BY_ROLE: Record<Role, string> = {
    student:
        APP_ROUTES.find((r) => r.roles.includes("student") && r.inNav !== false)
            ?.path ?? "/login",
    teacher:
        APP_ROUTES.find((r) => r.roles.includes("teacher") && r.inNav !== false)
            ?.path ?? "/login",
    admin:
        APP_ROUTES.find((r) => r.roles.includes("admin") && r.inNav !== false)
            ?.path ?? "/login",
};
