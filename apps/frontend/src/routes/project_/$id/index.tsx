import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/project_/$id/')({
  component: Project,
});

function Project() {
  const { id } = Route.useParams();

  if (id !== "123") { throw notFound(); }
  
  return <div className="p-2">Hello from project! { id }</div>
};
