import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../api";

export type AnalyzeAndRepairData = { projectId: string; fileId: string };

export type AnalyzeAndRepairDialogProps = {
  readonly data: AnalyzeAndRepairData | null;
  readonly onComplete: () => void;
};

type AnalyzeActionState = "pending" | "running" | "complete";

type AnalyzeAction = {
  name: string;
  handler: (data: AnalyzeAndRepairData) => Promise<void>;
  state: AnalyzeActionState;
};

async function doAnalysis(data: AnalyzeAndRepairData) {
  const resp = await fetch(`${API_BASE_URL}/analysis/${data.projectId}`, {
    method: "POST",
  });

  const result = await resp.json();

  if (!result.analysisId) { throw new Error("Unable to get analysis id"); }

  let found = false;

  while (!found) {
    await sleep(1000);

    const analysisResults = await (await fetch(`${API_BASE_URL}/upload/projects/${data.projectId}/analysis`)).json();

    if (Object.keys(analysisResults).length === 0) { continue; }

    found = analysisResults.sonar.some((x: { projectAnalysisId: string }) => x.projectAnalysisId === result.analysisId);
  }
}

async function fixFile(data: AnalyzeAndRepairData) {
  await fetch(
    `${API_BASE_URL}/fix/projects/${data.projectId}/files/${data.fileId}`,
    {
      method: "POST",
    },
  );
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function AvatarOnState(props: { readonly state: AnalyzeActionState }) {
  const sx = { width: 64, height: 64 };

  switch (props.state) {
    case "pending":
      return <Avatar sx={sx} src="/icons/viktor_pending.png" />;
    case "running":
      return <Avatar sx={sx} src="/icons/viktor_running.png" />;
    case "complete":
      return <Avatar sx={sx} src="/icons/viktor_complete.png" />;
  }
}

function TextOnState(props: { readonly state: AnalyzeActionState; readonly text: string }) {
  switch (props.state) {
    case "pending":
      return <span style={{ color: "#7a7a7a" }}>{props.text}</span>;
    case "running":
      return <span style={{ color: "#ffb71c" }}>{props.text}</span>;
    case "complete":
      return <span style={{ color: "#0bb81c" }}>{props.text}</span>;
  }
}

export function AnalyzeAndRepairDialog({
  data,
  onComplete,
}: AnalyzeAndRepairDialogProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [actions, setActions] = useState<AnalyzeAction[]>([]);

  function isComplete(actions: AnalyzeAction[]): boolean {
    if (actions.length === 0) {
      return false;
    }

    return actions.every((x) => x.state === "complete");
  }

  async function processActions(
    data: AnalyzeAndRepairData,
    actions: AnalyzeAction[],
  ) {
    const workingActions = actions;

    function firstActiveActionIndex(actions: AnalyzeAction[]): number {
      return actions.findIndex((x) => x.state === "pending");
    }

    while (!isComplete(workingActions)) {
      const index = firstActiveActionIndex(workingActions);
      const action = workingActions[index];

      workingActions[index].state = "running";
      setActions([...workingActions]);

      await action.handler(data);

      workingActions[index].state = "complete";
      setActions([...workingActions]);
    }
  }

  function handleComplete() {
    onComplete();
  }

  useEffect(() => {
    setIsOpen(data !== null); // eslint-disable-line react-hooks/set-state-in-effect
    if (data === null) {
      return;
    }

    const initialActions: AnalyzeAction[] = [
      { name: "Fix file (1/2)", handler: fixFile, state: "pending" },
      {
        name: "Analyze updated project (2/2)",
        handler: doAnalysis,
        state: "pending",
      }
    ];

    setActions(initialActions);
    processActions(structuredClone(data), initialActions);
  }, [data]);

  return (
    <Dialog open={isOpen} maxWidth="lg" fullWidth>
      <DialogTitle>Analyze and Repair Dialog</DialogTitle>

      <DialogContent>
        <List sx={{ width: "100%" }}>
          {actions.map((x) => (
            <ListItem key={x.name}>
              <ListItemAvatar sx={{ minWidth: "72px" }}>
                <AvatarOnState state={x.state} />
              </ListItemAvatar>
              <ListItemText>
                <TextOnState state={x.state} text={x.name} />
              </ListItemText>
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions>
        <Button disabled={!isComplete(actions)} onClick={handleComplete}>
          Complete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
