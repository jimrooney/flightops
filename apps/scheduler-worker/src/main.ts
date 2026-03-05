export interface WorkerHealth {
  ok: boolean;
  service: string;
}

export function startWorker(): WorkerHealth {
  return { ok: true, service: "scheduler-worker" };
}
