import { zodResolver } from '@hookform/resolvers/zod';
import { EchoCheckInputSchema, type EchoCheckInput } from '@nexora/shared';
import { useForm } from 'react-hook-form';
import { StatusCard } from '../../components/StatusCard';
import {
  useEchoCheckMutation,
  useHealthQuery,
  useSystemMetaQuery,
} from '../../hooks/useSystemHealth';

export function FoundationDashboard() {
  const healthQuery = useHealthQuery();
  const metaQuery = useSystemMetaQuery();
  const echoMutation = useEchoCheckMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EchoCheckInput>({
    resolver: zodResolver(EchoCheckInputSchema),
    defaultValues: {
      message: 'Nexora Foundation Ready',
    },
  });

  const onSubmit = (values: EchoCheckInput) => {
    echoMutation.mutate(values);
  };

  const health = healthQuery.data;
  const meta = metaQuery.data;

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          <span>Phase 1–2 Foundation Baseline</span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Nexora Hardware Commerce & Store Platform
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Single-vendor Modular Monolith powered by React, TypeScript, Vite, Tailwind CSS, Express,
          Prisma ORM, and MySQL 8.4 LTS.
        </p>
      </div>

      {healthQuery.isLoading || metaQuery.isLoading ? (
        <div
          role="status"
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300"
        >
          Checking live API and MySQL 8.4 foundation connectivity...
        </div>
      ) : null}

      {healthQuery.isError || metaQuery.isError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-5 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Unable to reach Nexora API. Verify Express server on port 3000 and MySQL 8.4 status.
          </span>
          <button
            type="button"
            onClick={() => {
              void healthQuery.refetch();
              void metaQuery.refetch();
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            Retry Connection
          </button>
        </div>
      ) : null}

      {health && meta ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="API Health"
            value={health.status === 'ok' ? 'ONLINE' : 'DEGRADED'}
            subtitle={`Service: ${health.service}`}
            tone={health.status === 'ok' ? 'success' : 'warning'}
          />
          <StatusCard
            title="MySQL 8.4 + Prisma"
            value={health.database.toUpperCase()}
            subtitle="Relational ACID store"
            tone={health.database === 'up' ? 'success' : 'danger'}
          />
          <StatusCard
            title="Business Model"
            value="Single-Vendor"
            subtitle={`Roles: ${meta.roles.join(', ')}`}
            tone="neutral"
          />
          <StatusCard
            title="Seeded Baseline"
            value={`${meta.usersCount} Users / ${meta.storeSettingsCount} Settings`}
            subtitle="Synthetic non-PII dev baseline"
            tone="neutral"
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-white">API Contract & Zod Validation Smoke Test</h2>
        <p className="mt-1 text-sm text-slate-400">
          Demonstrates React Hook Form + shared `@nexora/shared` Zod schema validation against{' '}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-blue-300">
            POST /api/v1/system/echo-check
          </code>
          .
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="echoMessage" className="sr-only">
              Diagnostic Message
            </label>
            <input
              id="echoMessage"
              type="text"
              {...register('message')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Enter diagnostic message..."
            />
            {errors.message ? (
              <p className="mt-1.5 text-xs text-rose-400">{errors.message.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={echoMutation.isPending}
            className="h-[42px] rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {echoMutation.isPending ? 'Verifying...' : 'Verify API Roundtrip'}
          </button>
        </form>

        {echoMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-200">
            Echo Confirmed: <strong>{echoMutation.data.message}</strong> at{' '}
            {echoMutation.data.receivedAt}
          </div>
        ) : null}

        {echoMutation.isError ? (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200">
            Validation or API transport request failed. Check API server status.
          </div>
        ) : null}
      </div>
    </section>
  );
}
