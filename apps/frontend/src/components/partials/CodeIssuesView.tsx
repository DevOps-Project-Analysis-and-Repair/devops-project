import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  alpha,
  Box,
  Card,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { IssueItem } from "../../services/analytics";

interface CodeIssuesViewProps {
  issues?: ReadonlyArray<IssueItem>;
  title?: string;
}

const severityOrder: Readonly<Record<IssueItem["severity"], number>> = {
  BLOCKER: 0,
  CRITICAL: 1,
  MAJOR: 2,
  MINOR: 3,
  INFO: 4,
};

function isClosedIssue(issue: Readonly<IssueItem>) {
  return issue.status === "CLOSED" || issue.status === "RESOLVED";
}

function getSeverityColor(severity: IssueItem["severity"]) {
  switch (severity) {
    case "INFO":
      return {
        chip: "info" as const,
        border: "info.light",
        background: "info.50",
        text: "info.dark",
      };
    case "MINOR":
      return {
        chip: "warning" as const,
        border: "warning.light",
        background: "warning.50",
        text: "warning.dark",
      };
    case "MAJOR":
      return {
        chip: "warning" as const,
        border: "warning.main",
        background: "warning.50",
        text: "warning.dark",
      };
    case "CRITICAL":
      return {
        chip: "error" as const,
        border: "error.main",
        background: "error.50",
        text: "error.dark",
      };
    case "BLOCKER":
      return {
        chip: "error" as const,
        border: "error.dark",
        background: "error.50",
        text: "error.dark",
      };
  }
}

function getSeverityIcon(severity: IssueItem["severity"]) {
  switch (severity) {
    case "INFO":
      return <InfoOutlinedIcon fontSize="small" />;
    case "MINOR":
    case "MAJOR":
      return <WarningAmberRoundedIcon fontSize="small" />;
    case "CRITICAL":
    case "BLOCKER":
      return <WarningAmberRoundedIcon fontSize="small" />;
  }
}

function getTypeIcon(type: IssueItem["type"]) {
  switch (type) {
    case "BUG":
      return <BugReportOutlinedIcon fontSize="small" />;
    case "VULNERABILITY":
      return <GppMaybeOutlinedIcon fontSize="small" />;
    case "CODE_SMELL":
    default:
      return <TipsAndUpdatesOutlinedIcon fontSize="small" />;
  }
}

function getTypeColor(type: IssueItem["type"]) {
  switch (type) {
    case "BUG":
      return "error" as const;
    case "VULNERABILITY":
      return "warning" as const;
    case "CODE_SMELL":
      return "info" as const;
  }
}

function formatType(type: IssueItem["type"]) {
  switch (type) {
    case "BUG":
      return "Bug";
    case "VULNERABILITY":
      return "Vulnerability";
    case "CODE_SMELL":
      return "Code Smell";
  }
}

function formatSeverity(severity: IssueItem["severity"]) {
  switch (severity) {
    case "INFO":
      return "Info";
    case "MINOR":
      return "Minor";
    case "MAJOR":
      return "Major";
    case "CRITICAL":
      return "Critical";
    case "BLOCKER":
      return "Blocker";
  }
}

function formatStatus(status?: IssueItem["status"]) {
  switch (status) {
    case "OPEN":
      return "Open";
    case "CONFIRMED":
      return "Confirmed";
    case "REOPENED":
      return "Reopened";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    default:
      return "Unknown";
  }
}

function formatRule(rule: string) {
  const [, shortRule] = rule.split(":");
  return shortRule ?? rule;
}

function sortIssues(issues: ReadonlyArray<IssueItem>) {
  return [...issues].sort((a, b) => {
    const aClosed = isClosedIssue(a) ? 1 : 0;
    const bClosed = isClosedIssue(b) ? 1 : 0;
    if (aClosed !== bClosed) return aClosed - bClosed;

    const lineDiff = a.line - b.line;
    if (lineDiff !== 0) return lineDiff;

    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    return a.message.localeCompare(b.message);
  });
}

function getIssueSummary(issues: ReadonlyArray<IssueItem>) {
  return {
    blocker: issues.filter((x) => x.severity === "BLOCKER" && !isClosedIssue(x)).length,
    critical: issues.filter((x) => x.severity === "CRITICAL" && !isClosedIssue(x)).length,
    major: issues.filter((x) => x.severity === "MAJOR" && !isClosedIssue(x)).length,
    minor: issues.filter((x) => x.severity === "MINOR" && !isClosedIssue(x)).length,
    info: issues.filter((x) => x.severity === "INFO" && !isClosedIssue(x)).length,
    closed: issues.filter(isClosedIssue).length,
  };
}

export function CodeIssuesView({
  issues = [],
  title = "Code issues",
}: Readonly<CodeIssuesViewProps>) {
  const theme = useTheme();

  if (issues.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          mt: 1,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            No code issues found for this file.
          </Typography>
        </Box>
      </Card>
    );
  }

  const sortedIssues = sortIssues(issues);
  const summary = getIssueSummary(sortedIssues);

  return (
    <Card
      elevation={0}
      sx={{
        mt: 1,
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {issues.length} {issues.length === 1 ? "issue" : "issues"} in this file
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {summary.blocker > 0 && (
              <Chip size="small" color="error" label={`${summary.blocker} blocker`} />
            )}
            {summary.critical > 0 && (
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`${summary.critical} critical`}
              />
            )}
            {summary.major > 0 && (
              <Chip size="small" color="warning" label={`${summary.major} major`} />
            )}
            {summary.minor > 0 && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`${summary.minor} minor`}
              />
            )}
            {summary.info > 0 && (
              <Chip size="small" color="info" variant="outlined" label={`${summary.info} info`} />
            )}
            {summary.closed > 0 && (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleOutlineIcon />}
                label={`${summary.closed} closed`}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      <Stack divider={<Divider flexItem />}>
        {sortedIssues.map((issue) => {
          const colors = getSeverityColor(issue.severity);
          const closed = isClosedIssue(issue);

          return (
            <Box
              key={issue.issueKey}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "84px 1fr" },
                alignItems: "stretch",
                opacity: closed ? 0.78 : 1,
                backgroundColor: closed
                  ? alpha(theme.palette.success.main, 0.04)
                  : "transparent",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.75,
                  borderRight: { xs: 0, sm: 1 },
                  borderBottom: { xs: 1, sm: 0 },
                  borderColor: closed ? "success.light" : "divider",
                  backgroundColor: closed ? alpha(theme.palette.success.main, 0.08) : colors.background,
                  display: "flex",
                  flexDirection: { xs: "row", sm: "column" },
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  Line
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: closed ? "success.dark" : colors.text,
                    lineHeight: 1,
                  }}
                >
                  {issue.line || "?"}
                </Typography>
              </Box>

              <Box sx={{ px: 2.25, py: 1.75 }}>
                <Stack spacing={1.25}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "flex-start" }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.4,
                        flex: 1,
                        color: closed ? "text.secondary" : "text.primary",
                      }}
                    >
                      {issue.message}
                    </Typography>

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        icon={closed ? <CheckCircleOutlineIcon fontSize="small" /> : getSeverityIcon(issue.severity)}
                        label={closed ? formatStatus(issue.status) : formatSeverity(issue.severity)}
                        color={closed ? "success" : colors.chip}
                      />
                      <Chip
                        size="small"
                        icon={getTypeIcon(issue.type)}
                        label={formatType(issue.type)}
                        color={getTypeColor(issue.type)}
                        variant="outlined"
                      />
                      {issue.status && !closed && (
                        <Chip
                          size="small"
                          label={formatStatus(issue.status)}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={`Rule: ${formatRule(issue.rule)}`}
                      variant="outlined"
                      color={closed ? "success" : "default"}
                    />
                    {issue.startLine > 0 && issue.endLine > issue.startLine && (
                      <Chip
                        size="small"
                        label={`Lines ${issue.startLine}-${issue.endLine}`}
                        variant="outlined"
                        color={closed ? "success" : "default"}
                      />
                    )}
                    {issue.tags.slice(0, 6).map((tag) => (
                      <Chip
                        key={tag}
                        size="small"
                        label={tag}
                        variant="filled"
                        color="default"
                      />
                    ))}
                  </Stack>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}
