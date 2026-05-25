# KGDS Roles and Permissions

## Overview

KGDS currently uses a simple MVP RBAC model built from seeded `roles`, `permissions`, and `role_permissions` tables.

- Roles define dashboard/user scope.
- Permissions define allowed capability areas.
- Role-permission assignments are currently seeded centrally.

This is the current MVP authorization model and may evolve as school, ministry, teacher, and student workflows become more specific.

## Roles

| Role | Description |
|---|---|
| `platform_super_admin` | Technical/system owner with auditable full access. |
| `ministry_admin` | Ministry-level dashboard and monitoring access. |
| `ministry_analyst` | Aggregated analytics access across schools. |
| `school_admin` | School administrative employee with operational access. |
| `teacher` | Teacher scoped to assigned sections and students. |
| `student` | Future student portal account. |

## Permissions

| Permission | Description |
|---|---|
| `schools:manage` | schools manage |
| `users:manage` | users manage |
| `students:manage` | students manage |
| `curriculum:manage` | curriculum manage |
| `analysis:run` | analysis run |
| `analysis:view` | analysis view |
| `documents:upload` | documents upload |
| `documents:review` | documents review |
| `analytics:view_ministry` | analytics view_ministry |
| `analytics:view_school` | analytics view_school |

## Role-Permission Matrix

Legend: `Y` = permission assigned

| Role | schools:manage | users:manage | students:manage | curriculum:manage | analysis:run | analysis:view | documents:upload | documents:review | analytics:view_ministry | analytics:view_school |
|---|---|---|---|---|---|---|---|---|---|---|
| `platform_super_admin` | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| `ministry_admin` |  | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| `ministry_analyst` |  | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| `school_admin` |  | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| `teacher` |  | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| `student` |  | Y | Y | Y | Y | Y | Y | Y | Y | Y |

## Current MVP Observations

- Only `platform_super_admin` has `schools:manage`.
- All other seeded roles currently share the same 9-permission set.
- The `student` role is present in seed data, but its permissions are still broad and should be treated as provisional for frontend planning.
