export function buildTaskResponse(
  taskId: string,
  status = 'created',
  stage = 'initializing',
  progress = 0,
) {
  return {
    id: taskId,
    status,
    stage,
    progress,
    links: {
      self: `/pipeline-task/${taskId}`,
      status: `/pipeline-task/${taskId}/status`,
      result: `/pipeline-task/${taskId}/result`,
      report: `/pipeline-task/${taskId}/report`,
      chunks: `/pipeline-task/${taskId}/chunks`,
    },
  };
}
