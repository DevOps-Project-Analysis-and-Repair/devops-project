import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import { useEffect, useState} from "react"
import { API_BASE_URL } from "../api";

export type AnalyzeAndRepairData = { projectId: string, fileId: string };

export type AnalyzeAndRepairDialogProps = {
  data: AnalyzeAndRepairData | null,
  onComplete: () => void
}

type AnalyzeActionState = 'pending' | 'running' | 'complete';

type AnalyzeAction = {
  name: string,
  handler: (data: AnalyzeAndRepairData) => Promise<void>,
  state: AnalyzeActionState
}

function AvatarOnState(props: { state: AnalyzeActionState }) {
  const sx = { width: 64, height: 64 };

  switch (props.state) {
    case "pending": return <Avatar sx={sx} src="/icons/viktor_pending.png"/>
    case "running": return <Avatar sx={sx} src="/icons/viktor_running.png"/>
    case "complete": return <Avatar sx={sx} src="/icons/viktor_complete.png"/>
  }
}

function TextOnState(props: { state: AnalyzeActionState, text: string }) {
  switch (props.state) {
    case "pending": return <span style={{ color: '#7a7a7a' }}>{props.text}</span>;
    case "running": return <span style={{ color: '#ffb71c' }}>{props.text}</span>;
    case "complete": return <span style={{ color: '#0bb81c' }}>{props.text}</span>;
  }
}

export function AnalyzeAndRepairDialog({ data, onComplete }: AnalyzeAndRepairDialogProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [actions, setActions] = useState<AnalyzeAction[]>([]);

  async function doAnalysis(data: AnalyzeAndRepairData) {
    await fetch(`${API_BASE_URL}/analysis/${data.projectId}`,
      {
        method: "POST"
      }
    );
  }

  async function fixFile(data: AnalyzeAndRepairData) {
    await fetch(`${API_BASE_URL}/fix/projects/${data.projectId}/files/${data.fileId}`,
      {
        method: "POST"
      }
    );
  }

  async function processActions(data: AnalyzeAndRepairData, actions: AnalyzeAction[]) {
    let workingActions = actions;

    function firstActiveActionIndex(actions: AnalyzeAction[]): number {
      return actions.findIndex(x => x.state === 'pending');
    }

    while (!isComplete(workingActions)) {
      const index = firstActiveActionIndex(workingActions);
      const action = workingActions[index];

      workingActions[index].state = 'running';
      setActions([...workingActions]);

      await action.handler(data);

      workingActions[index].state = 'complete';
      setActions([...workingActions]);
    }
  }

  function handleComplete() { onComplete(); }

  useEffect(() => {
    setIsOpen(data !== null);
    if (data === null) { return; }

    const initialActions: AnalyzeAction[] = [
      { name: 'Analyze current project (1/4)', handler: doAnalysis, state: 'pending' },
      { name: 'Fix file (2/4)', handler: fixFile, state: 'pending' },
      { name: 'Analyze updated project (3/4)', handler: doAnalysis, state: 'pending' },
      { name: 'Fix file (4/4)', handler: fixFile, state: 'pending' },
    ];

    setActions(initialActions);
    processActions(data, initialActions);

  }, [data]);

  function isComplete(actions: AnalyzeAction[]): boolean {
    if (actions.length === 0) { return false; }

    return actions.every(x => x.state === 'complete');
  }

  return (
    <Dialog open={isOpen} maxWidth="lg" fullWidth>
      <DialogTitle>Analyze and Repair Dialog</DialogTitle>

      <DialogContent>
          <List sx={{ width: '100%' }}>
            { actions.map((x, i) => 
                <ListItem key={i}>
                  <ListItemAvatar sx={{ minWidth: '72px' }}>
                    <AvatarOnState state={x.state} />
                  </ListItemAvatar>
                  <ListItemText>
                    <TextOnState state={x.state} text={x.name} />
                  </ListItemText>
                </ListItem>
              )
            }
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
