import { Box, Card, Chip, Divider, Typography } from "@mui/material";
import { CodeViewer } from "./CodeViewer";

interface CodeDiffViewerProps {
  beforeCode: string;
  afterCode: string;
  language: string;
}

const CodeDiffViewer = ({
  beforeCode,
  afterCode,
  language,
}: CodeDiffViewerProps) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "white",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.100",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontWeight={600}>Before</Typography>
          <Chip label="Old" size="small" color="error" />
        </Box>

        <Chip
          label={language}
          size="small"
          variant="outlined"
          sx={{ textTransform: "uppercase" }}
        />

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          justifyContent="flex-end"
        >
          <Typography fontWeight={600}>After</Typography>
          <Chip label="New" size="small" color="success" />
        </Box>
      </Box>

      {/* Code panels */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          height: "70vh",
        }}
      >
        <Box sx={{ overflow: "auto", p: 2 }}>
          <CodeViewer content={beforeCode} language={language} />
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box sx={{ overflow: "auto", p: 2 }}>
          <CodeViewer content={afterCode} language={language} />
        </Box>
      </Box>
    </Card>
  );
};

export default CodeDiffViewer;
