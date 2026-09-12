# Lab 3 UI Specification: TokTickIT

This document outlines the UI/UX contract for Lab 3, focusing on strict RBAC navigation, layout shells, and distinct functional views.

---

## 1. Design System Tokens
* **Primary Brand (Zen Green)**: `#006B3C`
* **Secondary Brand**: `#0B7A46`
* **Background Tint**: `#EAF6EF`
* **Error / Critical**: `#D92D20`
* **Warning**: `#F3A218`
* **Typography**: Inter (Sans-Serif), base size `16px`.
* **Spacing**: 8px modular scale.
* **Internal Note Highlight**: Subtle amber background `#FEF0C7` with dark text to clearly distinguish from public comments.

## 2. Role-Based Navigation Guards & Layout Shell
The application utilizes a common Authenticated App Header that adapts to the current user's role.

* **Global Header Elements**:
  * Application Logo (TokTickIT).
  * Current User Name & Avatar/Initials.
  * Role Badge (e.g., `[IT Staff]`).
  * Dropdown Menu: "Change Password", "Logout".
* **Navigation Menus**:
  * **Requester**: "My Tickets", "Create Ticket".
  * **IT Staff**: "Ticket Queue", "My Assigned Tickets".
  * **Administrator**: "Ticket Queue", "User Management", "System Settings" (placeholder).

## 3. Detailed Layouts & Mockups Specifications

### 3.1 Login & Change Password Screens
* **Login (`/login`)**: Centered card layout. Email and Password inputs. "Forgot Password" link (deferred scope). Clear validation error message placement below fields.
* **Change Password (`/change-password`)**: Triggered automatically on `mustChangePassword=true`. Requires "Current Password", "New Password", and "Confirm New Password". Real-time password strength and complexity indicator (checklist for min length, uppercase, number, symbol).

### 3.2 IT Staff Ticket Queue Screen (`/staff/queue`)
* **Layout**: Full-width data table interface.
* **Top Bar**: Search input, Filter Dropdowns (Status, Category, IT Priority, Owner).
* **Table Columns**: Ticket ID, Title, Status (colored badge), IT Priority, Requester, Owner, Created At.
* **Interactions**: Clickable rows navigating to the Ticket Detail Screen. Sortable column headers. Bottom pagination controls.

### 3.3 IT Staff Ticket Detail Screen (`/staff/tickets/:id`)
* **Layout**: Split view. Left pane for Ticket Details (Description, Metadata, Attachments). Right pane for Communications & Operations.
* **Right Pane Tabs**:
  * **Public Comments**: Default view. Standard white background.
  * **Internal Notes**: Badge showing note count. Background is `#FEF0C7` to explicitly warn staff this is private.
* **Service Actions Panel (Sticky/Sidebar)**:
  * Dropdown to update `Status`.
  * Dropdown to update `IT Priority`.
  * Dropdown/Search to update `Owner` (Assign to me shortcut).

### 3.4 Admin User Management Screen (`/admin/users`)
* **Layout**: Data table interface.
* **Top Bar**: "Add New User" primary button. Search and Role filters.
* **Table Columns**: Name, Email, Role, Status (Active/Inactive toggle or badge), Actions (Edit, Reset Password).
* **Create/Edit User Modal**: Slide-over panel or centered modal. Fields: First Name, Last Name, Email, Role dropdown, Active toggle.
* **Reset Password Action**: Confirmation dialog. Upon confirmation, displays temporary password or confirmation of reset.

## 4. Component States & Form Validation
* **Form Validation**: Evaluated `onBlur` for fields, and `onSubmit` for the entire form. Errors displayed inline in `#D92D20` text directly below the offending input.
* **Busy States**: Submit buttons transform into loaders/spinners during API calls. Forms are disabled while submitting.
* **Empty States**: Clear illustrations and text when a queue is empty or a search yields no results.

## 5. Responsive Breakpoints
* **Desktop (≥992px)**: Full multi-column layouts, sidebars visible, full data tables.
* **Tablet (768px - 991px)**: Collapsible sidebars, some table columns hidden or condensed.
* **Mobile (<768px)**: Stacked single-column layouts. Data tables convert to card-based list views. Bottom sheet navigation or hamburger menus replace top horizontal menus.
