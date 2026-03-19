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
  data: AnalyzeAndRepairData | null;
  onComplete: () => void;
};

interface AnalyzeAction {
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


const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export function AnalyzeAndRepairDialog({
  data,
  onComplete,
}: AnalyzeAndRepairDialogProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [actions, setActions] = useState<AnalyzeAction[]>([]);

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

  // I am aware that using useEffect with a dependency can lead to an infinite loop.
  // However, that is not the case here and fixing the it cleanly will take hours
  // It also goes against what I am trying to do, as I want the re-render to occur
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
          
          {actions.map((x, i) => {
            const actionState = ACTION_STATE[x.state]; 
            const defaultState =  ACTION_STATE['pending'];
            return (
            <ListItem key={i}>
              <ListItemAvatar sx={{ minWidth: "72px" }}>
               <Avatar sx={{ width: 64, height: 64 }} src={actionState.src || defaultState.src} />;
              </ListItemAvatar>
              <ListItemText>
                <span style={{ color: actionState.color || defaultState.color }}>{x.name}</span>;
              </ListItemText>
            </ListItem>
          )})}
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
