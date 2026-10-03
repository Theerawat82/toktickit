export const ZEN = {
  primary: "#006B3C",
  secondary: "#0B7A46",
  paleBg: "#EAF6EF",
  pageBg: "#F5F7F6",
  error: "#D92D20",
  warning: "#F79009",
  success: "#039855",
  neutral: "#344054",
  border: "#D0D5DD",
  white: "#FFFFFF",
};

export const priorityBadgeStyle: Record<string, { bg: string; color: string }> = {
  Low:      { bg: ZEN.paleBg,  color: ZEN.primary },
  Medium:   { bg: "#FFF7E6",   color: "#B54708" },
  High:     { bg: "#FEF3F2",   color: "#B42318" },
  Critical: { bg: "#FEE4E2",   color: "#912018" },
};

export const statusBadgeStyle: Record<string, { bg: string; color: string }> = {
  New:         { bg: ZEN.paleBg,  color: ZEN.primary },
  Open:        { bg: "#E0F2FE",   color: "#026AA2" },
  In_Progress: { bg: "#FFF7E6",   color: "#B54708" },
  Pending:     { bg: "#F2F4F7",   color: "#344054" },
  Waiting_for_Requester: { bg: "#F2F4F7",   color: "#344054" },
  Resolved:    { bg: "#D1FADF",   color: "#027A48" },
  Reopened:    { bg: "#FEF3F2",   color: "#B42318" },
  Closed:      { bg: "#F2F4F7",   color: "#667085" },
  Cancelled:   { bg: "#F2F4F7",   color: "#667085" }
};
