const fs = require('fs');
let code = fs.readFileSync('client/src/App.tsx', 'utf8');
code = code.replace(
  '<>\r\n          {currentHash === "#admin/users" && user?.role === "Administrator" ? (\r\n            <UserManagement />\r\n          ) : ticketId ? (',
  '<>\r\n          {currentHash === "#admin/users" && user?.role === "Administrator" ? (\r\n            <UserManagement />\r\n          ) : currentHash === "#dashboard" ? (\r\n            user?.role === "IT_Staff" || user?.role === "Administrator" ? (\r\n              <StaffDashboard />\r\n            ) : (\r\n              <RequesterDashboard />\r\n            )\r\n          ) : ticketId ? ('
);
fs.writeFileSync('client/src/App.tsx', code);
