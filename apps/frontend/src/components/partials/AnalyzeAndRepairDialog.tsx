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
import { getAnalysis, performAnalysis } from "../../services/analysisService";
import { fixFile } from "../../services/fixService";
import { sleep } from "../../util";

export type AnalyzeAndRepairData = { projectId: string; fileId: string };

export type AnalyzeAndRepairDialogProps = {
  readonly data: AnalyzeAndRepairData | null;
  readonly onComplete: () => void;
};

type AnalyzeAction = {
  id: string;
  name: string;
  handler: (data: AnalyzeAndRepairData) => Promise<void>;
  state: "pending" | "running" | "complete";
};

const ACTION_STATE = {
  pending: {
    src: "/icons/viktor_pending.png",
    color: "#7a7a7a",
  },
  running: {
    src: "/icons/viktor_running.png",
    color: "#ffb71c",
  },
  complete: {
    src: "/icons/viktor_complete.png",
    color: "#0bb81c",
  },
} as const;

async function doAnalysis(data: AnalyzeAndRepairData) {
  const result = await performAnalysis(data.projectId);

  if (!result.analysisId) { throw new Error("Unable to get analysis id"); }

  let found = false;

  while (!found) {
    await sleep(1000);

    const analysisResults = await getAnalysis(data.projectId);

    if (Object.keys(analysisResults).length === 0) { continue; }

    found = analysisResults.sonar.some((x: { projectAnalysisId: string }) => x.projectAnalysisId === result.analysisId);
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

  useEffect(() => {
    setIsOpen(data !== null);
    if (data === null) {
      return;
    }

    const initialActions: AnalyzeAction[] = [
      { id: "fix-file", name: "Fix file (1/2)", handler: (data) => fixFile(data.projectId, data.fileId), state: "pending" },
      { id: "analyze-project", name: "Analyze updated project (2/2)", handler: doAnalysis, state: "pending" }
    ];

    setActions(initialActions);

    async function processActions(
      data: AnalyzeAndRepairData,
      actions: AnalyzeAction[],
    ) {
      const workingActions = [...actions];

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

    processActions(structuredClone(data), initialActions);
  }, [data]);

  function handleComplete() {
    onComplete();
  }

  return (
    <Dialog open={isOpen} maxWidth="lg" fullWidth>
      <DialogTitle>Analyze and Repair Dialog</DialogTitle>

      <DialogContent>
        <List sx={{ width: "100%" }}>
          {actions.map((action) => {
            const actionState = ACTION_STATE[action.state];
            const defaultState = ACTION_STATE['pending'];

            return (
              <ListItem key={action.id}>
                <ListItemAvatar sx={{ minWidth: "72px" }}>
                  <Avatar sx={{ width: 64, height: 64 }} src={actionState.src || defaultState.src} />
                </ListItemAvatar>
                <ListItemText>
                  <span style={{ color: actionState.color || defaultState.color }}>{action.name}</span>
                </ListItemText>
              </ListItem>
            );
          })}
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
